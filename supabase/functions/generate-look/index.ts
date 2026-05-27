// Edge Function: generate-look
//
// Input  : { prompt: string }
// Output : { data: { look: { id, prompt, result_image_url, products_used,
//                            gemini_reasoning, gaps } } }
// Errors : { error: { code, message } }
//
// Flow:
//   1. Read profile (needs saved_selfie_url)
//   2. Read user's makeup products
//   3. Gemini picks subset + assigns slots (structured output, Zod-validated)
//   4. Filter picks to owned product_ids + valid slots
//   5. Map slots to Perfect Corp Makeup VTO effects
//   6. Run Perfect Corp ai-makeup with the selfie + effect_list
//   7. Fetch result image, upload to looks bucket
//   8. Insert looks row
//
// If Perfect Corp VTO call fails, we still save the looks row with
// result_image_url = null so the user sees the product breakdown.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { z } from "npm:zod@4";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { lookPrompt, lookPromptStricter } from "../_shared/prompts.ts";
import { lookOrchestration } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

// Slot names (Gemini output) → Perfect Corp category strings.
const SLOT_TO_PC_CATEGORY: Record<string, string> = {
  foundation: "foundation",
  concealer: "concealer",
  blush: "blush",
  bronzer: "bronzer",
  contour: "contour",
  highlighter: "highlighter",
  lipstick: "lip_color",
  "lip liner": "lip_liner",
  eyeshadow: "eye_shadow",
  eyeliner: "eye_liner",
  eyelash: "eyelashes",
  eyebrow: "eyebrows",
};

// Default color + intensity per PC category, plus any category-specific fields.
interface CategoryDefaults {
  color: string;
  colorIntensity: number;
  pattern?: string;
  shape?: string;
  style?: string;
}
const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  foundation:  { color: "#E8C5A0", colorIntensity: 0.45 },
  concealer:   { color: "#EDD0B0", colorIntensity: 0.45 },
  blush:       { color: "#E8919A", colorIntensity: 0.50, pattern: "natural" },
  bronzer:     { color: "#C68642", colorIntensity: 0.40, pattern: "natural" },
  contour:     { color: "#B07850", colorIntensity: 0.40, pattern: "natural" },
  highlighter: { color: "#FFE5B4", colorIntensity: 0.50, pattern: "natural" },
  lip_color:   { color: "#C44B4B", colorIntensity: 0.80, shape: "natural", style: "matte" },
  lip_liner:   { color: "#A83030", colorIntensity: 0.70, pattern: "natural" },
  eye_shadow:  { color: "#8B7355", colorIntensity: 0.60, pattern: "natural" },
  eye_liner:   { color: "#2C2C2C", colorIntensity: 0.80, pattern: "natural" },
  eyelashes:   { color: "#1A1A1A", colorIntensity: 0.90, pattern: "natural" },
  eyebrows:    { color: "#5C4033", colorIntensity: 0.60, pattern: "natural" },
};

function buildEffects(
  picks: Array<{ slot: string }>,
  skinToneData: unknown,
): Array<Record<string, unknown>> {
  const effects: Array<Record<string, unknown>> = [];

  for (const pick of picks) {
    const category = SLOT_TO_PC_CATEGORY[pick.slot];
    if (!category) continue;
    const defs = CATEGORY_DEFAULTS[category];
    if (!defs) continue;

    // Foundation / concealer: use the user's actual skin tone hex if available.
    let paletteColor = defs.color;
    if (
      (category === "foundation" || category === "concealer") &&
      skinToneData !== null &&
      typeof skinToneData === "object"
    ) {
      const st = skinToneData as Record<string, unknown>;
      if (typeof st.hex_color === "string" && st.hex_color.startsWith("#")) {
        paletteColor = st.hex_color;
      }
    }

    const effect: Record<string, unknown> = {
      category,
      palettes: [{ color: paletteColor, colorIntensity: defs.colorIntensity }],
    };
    if (defs.pattern !== undefined) effect.pattern = defs.pattern;
    if (defs.shape   !== undefined) effect.shape   = defs.shape;
    if (defs.style   !== undefined) effect.style   = defs.style;

    effects.push(effect);
  }

  return effects;
}

const VALID_SLOTS = Object.keys(SLOT_TO_PC_CATEGORY);

const requestBody = z.object({ prompt: z.string().min(1).max(280) });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    let rawBody: unknown;
    try { rawBody = await req.json(); }
    catch { return errorResponse("invalid_json", "request body is not valid JSON", 400); }

    const parsed = requestBody.safeParse(rawBody);
    if (!parsed.success) return errorResponse("invalid_request", parsed.error.message, 400);
    const userPrompt = parsed.data.prompt;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("saved_selfie_url, skin_tone_data, face_data")
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile?.saved_selfie_url) {
      return errorResponse(
        "no_selfie",
        "save a selfie first by running skin analysis",
        400,
      );
    }

    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, name, brand, subcategory")
      .eq("category", "makeup");
    if (productsErr) throw productsErr;
    if (!products || products.length === 0) {
      return errorResponse("no_makeup", "you need at least one makeup product", 400);
    }

    const ownedIds = new Set(products.map((product: { id: string }) => product.id));

    const faceData = profile.face_data as { face_shape?: unknown } | null;
    const faceShape =
      faceData && typeof faceData.face_shape === "string"
        ? faceData.face_shape
        : null;

    const orchestration = await callGeminiJson({
      prompt: lookPrompt(userPrompt, products, VALID_SLOTS, faceShape),
      retryPrompt: lookPromptStricter(userPrompt, products, VALID_SLOTS, faceShape),
      geminiSchema: {
        type: "OBJECT",
        properties: {
          products: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                product_id: { type: "STRING" },
                slot: { type: "STRING" },
              },
              required: ["product_id", "slot"],
            },
          },
          reasoning: { type: "STRING" },
          gaps: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["products", "reasoning", "gaps"],
      },
      validator: lookOrchestration,
    });

    const usedSlots = new Set<string>();
    const picks = orchestration.products.filter((pick) => {
      if (!ownedIds.has(pick.product_id)) return false;
      if (!SLOT_TO_PC_CATEGORY[pick.slot]) return false;
      if (usedSlots.has(pick.slot)) return false;
      usedSlots.add(pick.slot);
      return true;
    });

    const lookId = crypto.randomUUID();
    let resultStoragePath: string | null = null;

    if (picks.length > 0) {
      try {
        const { data: selfie, error: dlErr } = await supabase.storage
          .from("selfies")
          .download(profile.saved_selfie_url);
        if (dlErr || !selfie) throw dlErr ?? new Error("no selfie blob");
        const bytes = new Uint8Array(await selfie.arrayBuffer());
        const contentType = selfie.type || "image/jpeg";
        const fileName = profile.saved_selfie_url.split("/").pop() ?? "selfie.jpg";

        const resultUrl = await runPerfectCorpTask({
          featureName: "makeup-vto",
          bytes,
          contentType,
          fileName,
          taskParams: {
            effects: buildEffects(picks, profile.skin_tone_data),
            version: "1.0",
          },
        });

        const imgRes = await fetch(resultUrl);
        if (!imgRes.ok) throw new Error(`fetch vto ${imgRes.status}: ${imgRes.statusText}`);
        const imgBlob = await imgRes.blob();
        const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());

        const lookPath = `${userId}/${lookId}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("looks")
          .upload(lookPath, imgBytes, {
            contentType: imgBlob.type || "image/jpeg",
            upsert: true,
          });
        if (upErr) throw upErr;
        resultStoragePath = lookPath;
      } catch (err) {
        console.warn("VTO failed; saving look without image:", err);
      }
    }

    const productsUsed = picks.map((pick) => ({
      product_id: pick.product_id,
      slot: pick.slot,
    }));

    const { data: look, error: insertErr } = await supabase
      .from("looks")
      .insert({
        id: lookId,
        user_id: userId,
        prompt: userPrompt,
        result_image_url: resultStoragePath,
        products_used: productsUsed,
        gemini_reasoning: orchestration.reasoning,
      })
      .select("*")
      .single();
    if (insertErr) throw insertErr;

    return jsonResponse({
      data: { look: { ...look, gaps: orchestration.gaps } },
    });
  } catch (err) {
    console.error("generate-look error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
