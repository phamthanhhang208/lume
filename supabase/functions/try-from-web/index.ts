// Edge Function: try-from-web (Chrome extension stretch flow)
//
// Input  : { image_url: string, page_title?: string, page_url?: string }
// Output : { data: { classification, slot?, concerns?, result_image_url, reasoning } }
//
// Steps:
//   1. Verify JWT
//   2. Validate body
//   3. Fetch the product image from image_url (server-side, no CORS)
//   4. Ask Gemini Vision: makeup or skincare? slot/concerns?
//   5. Read profile.saved_selfie_url
//   6. Branch:
//      - makeup with slot → Perfect Corp ai-makeup with default effect for slot
//      - skincare with concerns → Perfect Corp skin-simulation with concerns
//      - unknown → return classification only

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { z } from "npm:zod@4";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { normalizeForPC } from "../_shared/image.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import {
  buildMakeupEffects,
  SLOT_TO_LEGACY_EFFECT,
  VALID_MAKEUP_SLOTS,
} from "../_shared/makeup.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import {
  clashPrompt,
  clashPromptStricter,
  type ClashRoutineProduct,
} from "../_shared/prompts.ts";
import { clashCheck, type ClashCheck } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

const VALID_SLOTS = VALID_MAKEUP_SLOTS;
const VALID_CONCERNS = [
  "acne",
  "wrinkle",
  "pore",
  "redness",
  "dark_spot",
  "dark_circle",
  "texture",
  "oiliness",
  "moisture",
  "firmness",
];

// Skin Simulation takes top-level float params (0-1, 1 = most improved) and
// wants all 10 keys present. Concerns without a corresponding param
// (oiliness/moisture/firmness) are classified but not simulated.
const PC_SIM_KEYS = [
  "wrinkle", "radiance", "oiliness", "acne", "eye_bags",
  "dark_circle", "spots", "pores", "texture", "redness",
] as const;
const CONCERN_TO_SIM_PARAM: Record<string, string> = {
  acne: "acne",
  wrinkle: "wrinkle",
  pore: "pores",
  redness: "redness",
  dark_spot: "spots",
  dark_circle: "dark_circle",
  texture: "texture",
};
// Classification concern → our scan metric key, to personalize intensity.
const CONCERN_TO_METRIC: Record<string, string> = {
  acne: "acne",
  wrinkle: "wrinkle",
  pore: "pore",
  redness: "redness",
  dark_spot: "age_spot",
  dark_circle: "dark_circle",
  texture: "texture",
};
const GENERIC_INTENSITY = 0.8;
const LOW_SCORE_CUTOFF = 85;

/** Lower score → stronger simulated improvement, clamped to [0.3, 1]. */
function improvementIntensity(score: number): number {
  const raw = (LOW_SCORE_CUTOFF - score) / LOW_SCORE_CUTOFF;
  return Math.min(1, Math.max(0.3, Number(raw.toFixed(2))));
}

const requestBody = z.object({
  image_url: z.string().url(),
  page_title: z.string().max(280).optional(),
  page_url: z.string().url().optional(),
});

const classificationResult = z.object({
  classification: z.enum(["makeup", "skincare", "unknown"]),
  slot: z.string().nullable().optional(),
  concerns: z.array(z.string()).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  product_name: z.string().nullable().optional().default(null),
  key_actives: z.array(z.string()).optional().default([]),
  reasoning: z.string(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { supabase } = auth;

    let rawBody: unknown;
    try { rawBody = await req.json(); }
    catch { return errorResponse("invalid_json", "request body is not valid JSON", 400); }

    const parsed = requestBody.safeParse(rawBody);
    if (!parsed.success) return errorResponse("invalid_request", parsed.error.message, 400);
    const { image_url, page_title, page_url } = parsed.data;

    const imgRes = await fetch(image_url);
    if (!imgRes.ok) {
      return errorResponse("image_fetch_failed", `${imgRes.status}: ${imgRes.statusText}`, 502);
    }
    const imgBlob = await imgRes.blob();
    const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
    const imgMime = imgBlob.type || "image/jpeg";

    const classificationPrompt = `Classify this beauty product image as "makeup" or "skincare" (or "unknown" if uncertain).
${page_title ? `Page title: ${page_title}\n` : ""}${page_url ? `Page URL: ${page_url}\n` : ""}
If makeup, pick one slot from: ${VALID_SLOTS.join(", ")}, and estimate the product's dominant color as hex "#RRGGBB" (the pigment color, not the packaging). Return color null if unclear.
If skincare, pick 1-3 concerns from: ${VALID_CONCERNS.join(", ")}, and list the likely key active ingredients (e.g. ["retinol"], ["niacinamide","zinc"]) as key_actives — empty array if unclear.
Also read the product's name from the label or page title as product_name (null if unreadable).
Always include a 1-sentence reasoning.`;

    const classificationStricter = `Return ONLY JSON: {"classification":"makeup"|"skincare"|"unknown","slot"?:string,"concerns"?:string[],"color"?:string|null,"product_name":string|null,"key_actives":string[],"reasoning":string}.
If classification is "makeup", slot MUST be one of: ${VALID_SLOTS.join(", ")}, and color is the product pigment hex "#RRGGBB" or null.
If classification is "skincare", concerns MUST be a subset of: ${VALID_CONCERNS.join(", ")}.
Image is a product photo${page_title ? ` from page "${page_title}"` : ""}.`;

    const classified = await callGeminiJson({
      prompt: classificationPrompt,
      retryPrompt: classificationStricter,
      image: { mimeType: imgMime, bytes: imgBytes },
      geminiSchema: {
        type: "OBJECT",
        properties: {
          classification: { type: "STRING", enum: ["makeup", "skincare", "unknown"] },
          slot: { type: "STRING", nullable: true },
          concerns: { type: "ARRAY", items: { type: "STRING" } },
          color: { type: "STRING", nullable: true },
          product_name: { type: "STRING", nullable: true },
          key_actives: { type: "ARRAY", items: { type: "STRING" } },
          reasoning: { type: "STRING" },
        },
        required: ["classification", "reasoning"],
      },
      validator: classificationResult,
    });

    if (classified.classification === "unknown") {
      return jsonResponse({
        data: {
          classification: "unknown",
          result_image_url: null,
          reasoning: classified.reasoning,
        },
      });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("saved_selfie_url")
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile?.saved_selfie_url) {
      return errorResponse(
        "no_saved_selfie",
        "save a selfie in the Lume app (run skin analysis) before using the extension",
        400,
      );
    }

    const { data: selfie, error: dlErr } = await supabase.storage
      .from("selfies")
      .download(profile.saved_selfie_url);
    if (dlErr || !selfie) {
      return errorResponse("download_failed", dlErr?.message ?? "no blob", 500);
    }
    const rawSelfie = new Uint8Array(await selfie.arrayBuffer());
    const { bytes: selfieBytes, contentType: selfieMime } =
      await normalizeForPC(rawSelfie, 1920);
    const selfieName = "selfie.jpg";

    // Signed selfie URL so the panel can show a before|after grid.
    let selfieSignedUrl: string | null = null;
    {
      const { data: signedData } = await supabase.storage
        .from("selfies")
        .createSignedUrl(profile.saved_selfie_url, 60 * 60);
      selfieSignedUrl = signedData?.signedUrl ?? null;
    }

    let resultUrl: string | null = null;
    let personalized = false;
    let concernsMatched: string[] = [];
    let concernsNotNeeded: string[] = [];
    let clashes: ClashCheck["clashes"] = [];

    if (classified.classification === "makeup") {
      const slot = classified.slot && SLOT_TO_LEGACY_EFFECT[classified.slot]
        ? classified.slot
        : null;
      if (!slot) {
        return jsonResponse({
          data: {
            classification: "makeup",
            slot: classified.slot ?? null,
            product_name: classified.product_name,
            result_image_url: null,
            selfie_signed_url: selfieSignedUrl,
            reasoning: classified.reasoning,
          },
        });
      }
      try {
        const effects = buildMakeupEffects(
          [{ slot, color: classified.color ?? null }],
          null,
        );
        resultUrl = await runPerfectCorpTask({
          featureName: "makeup-vto",
          bytes: selfieBytes,
          contentType: selfieMime,
          fileName: selfieName,
          taskParams: { version: "1.0", effects },
        });
      } catch (err) {
        console.warn("makeup VTO failed (returning classification only):", err);
      }
    } else {
      const concerns = (classified.concerns ?? []).filter((concern) =>
        VALID_CONCERNS.includes(concern),
      );

      // Personalize: intersect what the product targets with the user's
      // actual latest scan. Concerns the user doesn't need get intensity 0
      // and are reported honestly instead of rendered.
      const { data: latestScan } = await supabase
        .from("scans")
        .select("metrics")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const metrics = (latestScan?.metrics ?? null) as
        | Record<string, number>
        | null;

      const simParams: Record<string, number> = Object.fromEntries(
        PC_SIM_KEYS.map((k) => [k, 0]),
      );
      for (const concern of concerns) {
        const param = CONCERN_TO_SIM_PARAM[concern];
        if (!param) continue;
        if (metrics) {
          const metricKey = CONCERN_TO_METRIC[concern];
          const score = metricKey ? metrics[metricKey] : undefined;
          if (typeof score === "number" && score < LOW_SCORE_CUTOFF) {
            simParams[param] = improvementIntensity(score);
            concernsMatched.push(concern);
          } else {
            concernsNotNeeded.push(concern);
          }
        } else {
          simParams[param] = GENERIC_INTENSITY;
          concernsMatched.push(concern);
        }
      }
      personalized = !!metrics;

      // Clash check against the routine, in parallel with the render.
      const clashPromise = (async () => {
        try {
          let routineProducts: ClashRoutineProduct[] = [];
          const { data: activeRoutine } = await supabase
            .from("routines")
            .select("id, routine_products(product_id)")
            .eq("is_active", true)
            .maybeSingle();
          const routineIds = (
            (activeRoutine?.routine_products ?? []) as Array<{ product_id: string }>
          ).map((rp) => rp.product_id);
          const query = supabase
            .from("products")
            .select("name, brand, ingredients")
            .eq("category", "skincare");
          const { data: prods } = routineIds.length > 0
            ? await query.in("id", routineIds)
            : await query;
          routineProducts = (prods ?? []) as ClashRoutineProduct[];
          if (routineProducts.length === 0) return [];

          const webProduct = {
            name: classified.product_name,
            actives: classified.key_actives,
            concerns,
          };
          const result = await callGeminiJson({
            prompt: clashPrompt(webProduct, routineProducts),
            retryPrompt: clashPromptStricter(webProduct, routineProducts),
            geminiSchema: {
              type: "OBJECT",
              properties: {
                clashes: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      with_product: { type: "STRING" },
                      pair: { type: "STRING" },
                      severity: { type: "STRING", enum: ["info", "caution", "avoid"] },
                      note: { type: "STRING" },
                    },
                    required: ["with_product", "pair", "severity", "note"],
                  },
                },
              },
              required: ["clashes"],
            },
            validator: clashCheck,
          });
          return result.clashes;
        } catch (err) {
          console.warn("clash check failed (returning none):", err);
          return [];
        }
      })();

      const renderPromise = (async () => {
        if (!Object.values(simParams).some((v) => v > 0)) return null;
        try {
          return await runPerfectCorpTask({
            featureName: "skin-simulation",
            bytes: selfieBytes,
            contentType: selfieMime,
            fileName: selfieName,
            taskParams: simParams,
          });
        } catch (err) {
          console.warn("skin simulation failed (returning classification only):", err);
          return null;
        }
      })();

      [clashes, resultUrl] = await Promise.all([clashPromise, renderPromise]);
    }

    return jsonResponse({
      data: {
        classification: classified.classification,
        slot: classified.slot ?? null,
        concerns: classified.concerns ?? [],
        color: classified.color ?? null,
        product_name: classified.product_name,
        result_image_url: resultUrl,
        selfie_signed_url: selfieSignedUrl,
        personalized,
        concerns_matched: concernsMatched,
        concerns_not_needed: concernsNotNeeded,
        clashes,
        reasoning: classified.reasoning,
      },
    });
  } catch (err) {
    console.error("try-from-web error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
