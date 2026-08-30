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

// Skin Simulation takes top-level float params (0-1, 1 = most improved).
// Concerns without a corresponding param (oiliness/moisture/firmness) are
// classified but not simulated.
const CONCERN_TO_SIM_PARAM: Record<string, string> = {
  acne: "acne",
  wrinkle: "wrinkle",
  pore: "pores",
  redness: "redness",
  dark_spot: "spots",
  dark_circle: "dark_circle",
  texture: "texture",
};
const SIM_INTENSITY = 0.8;

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
If skincare, pick 1-3 concerns from: ${VALID_CONCERNS.join(", ")}.
Always include a 1-sentence reasoning.`;

    const classificationStricter = `Return ONLY JSON: {"classification":"makeup"|"skincare"|"unknown","slot"?:string,"concerns"?:string[],"color"?:string|null,"reasoning":string}.
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

    let resultUrl: string | null = null;

    try {
      if (classified.classification === "makeup") {
        const slot = classified.slot && SLOT_TO_LEGACY_EFFECT[classified.slot]
          ? classified.slot
          : null;
        if (!slot) {
          return jsonResponse({
            data: {
              classification: "makeup",
              slot: classified.slot ?? null,
              result_image_url: null,
              reasoning: classified.reasoning,
            },
          });
        }
        const effects = buildMakeupEffects(
          [{ slot, color: classified.color ?? null }],
          null,
        );
        try {
          resultUrl = await runPerfectCorpTask({
            featureName: "makeup-vto",
            bytes: selfieBytes,
            contentType: selfieMime,
            fileName: selfieName,
            taskParams: { version: "1.0", effects },
          });
        } catch (vtoErr) {
          console.warn("makeup-vto failed; falling back to legacy ai-makeup:", vtoErr);
          resultUrl = await runPerfectCorpTask({
            featureName: "ai-makeup",
            bytes: selfieBytes,
            contentType: selfieMime,
            fileName: selfieName,
            taskParams: {
              params: { effect_list: [{ feature_name: SLOT_TO_LEGACY_EFFECT[slot] }] },
            },
          });
        }
      } else {
        const concerns = (classified.concerns ?? []).filter((concern) =>
          VALID_CONCERNS.includes(concern),
        );
        const simParams: Record<string, number> = {};
        for (const concern of concerns) {
          const param = CONCERN_TO_SIM_PARAM[concern];
          if (param) simParams[param] = SIM_INTENSITY;
        }
        resultUrl = await runPerfectCorpTask({
          featureName: "skin-simulation",
          bytes: selfieBytes,
          contentType: selfieMime,
          fileName: selfieName,
          taskParams: simParams,
        });
      }
    } catch (err) {
      console.warn("Perfect Corp call failed (returning classification only):", err);
    }

    return jsonResponse({
      data: {
        classification: classified.classification,
        slot: classified.slot ?? null,
        concerns: classified.concerns ?? [],
        result_image_url: resultUrl,
        reasoning: classified.reasoning,
      },
    });
  } catch (err) {
    console.error("try-from-web error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
