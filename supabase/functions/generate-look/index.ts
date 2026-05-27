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
import { Image } from "npm:imagescript@1";

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

/** Resize to ≤ 1920×1920 (PC hard limit). Returns JPEG bytes. */
async function resizeForPC(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const MAX = 1920;
  const img = await Image.decode(bytes);
  if (img.width <= MAX && img.height <= MAX) {
    // Still re-encode as JPEG so content-type is always consistent.
    return { bytes: await img.encodeJPEG(90), contentType: "image/jpeg" };
  }
  const scale = Math.min(MAX / img.width, MAX / img.height);
  img.resize(Math.floor(img.width * scale), Math.floor(img.height * scale));
  return { bytes: await img.encodeJPEG(90), contentType: "image/jpeg" };
}

/**
 * Builds the `effects` array for the PC makeup-vto task body.
 *
 * Palette rules (from the MCP schema):
 *  - colorIntensity is always integer 0-100
 *  - pattern / shape / style are OBJECTS { name } / { type }, not strings
 *  - each category has unique required palette fields
 */
function buildEffects(
  picks: Array<{ slot: string }>,
  skinToneData: unknown,
): Array<Record<string, unknown>> {
  // Pull the user's measured skin-tone hex (for foundation/concealer).
  let skinHex = "#E8C5A0"; // medium-beige fallback
  if (skinToneData !== null && typeof skinToneData === "object") {
    const st = skinToneData as Record<string, unknown>;
    if (typeof st.hex_color === "string" && st.hex_color.startsWith("#")) {
      skinHex = st.hex_color;
    }
  }

  // Always start with a light skin-smooth base.
  const effects: Array<Record<string, unknown>> = [
    { category: "skin_smooth", skinSmoothStrength: 40, skinSmoothColorIntensity: 30 },
  ];

  for (const pick of picks) {
    const category = SLOT_TO_PC_CATEGORY[pick.slot];
    if (!category) continue;

    switch (category) {
      // ── Face base ─────────────────────────────────────────────────────────
      case "foundation":
        effects.push({
          category: "foundation",
          palettes: [{
            color: skinHex,
            colorIntensity: 45,
            coverageIntensity: 50,
            glowIntensity: 20,
          }],
        });
        break;

      case "concealer":
        // No pattern for concealer.
        effects.push({
          category: "concealer",
          palettes: [{
            color: skinHex,
            colorIntensity: 45,
            colorUnderEyeIntensity: 40,
            coverageLevel: 50,
          }],
        });
        break;

      // ── Colour / sculpt ───────────────────────────────────────────────────
      case "blush":
        effects.push({
          category: "blush",
          pattern: { name: "1color1" },
          palettes: [{ color: "#E8919A", colorIntensity: 50, texture: "matte" }],
        });
        break;

      case "bronzer":
        effects.push({
          category: "bronzer",
          pattern: { name: "Bronzer1" },
          palettes: [{ color: "#C68642", colorIntensity: 40 }],
        });
        break;

      case "contour":
        effects.push({
          category: "contour",
          pattern: { name: "OvalFace6" },
          palettes: [{ color: "#B07850", colorIntensity: 40 }],
        });
        break;

      case "highlighter":
        effects.push({
          category: "highlighter",
          pattern: { name: "OvalFace2" },
          palettes: [{
            color: "#FFE5B4",
            colorIntensity: 50,
            glowIntensity: 40,
            shimmerIntensity: 50,
            shimmerDensity: 40,
            shimmerSize: 30,
          }],
        });
        break;

      // ── Lips ──────────────────────────────────────────────────────────────
      case "lip_color":
        effects.push({
          category: "lip_color",
          shape: { name: "original" },  // keep natural lip silhouette
          style: { type: "full" },
          palettes: [{ color: "#C44B4B", colorIntensity: 80, texture: "matte" }],
        });
        break;

      case "lip_liner":
        effects.push({
          category: "lip_liner",
          pattern: { name: "Natural1" },
          palettes: [{
            color: "#A83030",
            colorIntensity: 70,
            texture: "matte",
            thickness: 30,
            smoothness: 60,
          }],
        });
        break;

      // ── Eyes ──────────────────────────────────────────────────────────────
      case "eye_shadow":
        effects.push({
          category: "eye_shadow",
          pattern: { name: "1color1" },
          palettes: [{ color: "#8B7355", colorIntensity: 60, texture: "matte" }],
        });
        break;

      case "eye_liner":
        effects.push({
          category: "eye_liner",
          pattern: { name: "Arabic3" },
          palettes: [{ color: "#2C2C2C", colorIntensity: 80, texture: "matte" }],
        });
        break;

      case "eyelashes":
        // Eyelashes: no texture field.
        effects.push({
          category: "eyelashes",
          pattern: { name: "Upper1" },
          palettes: [{ color: "#1A1A1A", colorIntensity: 90 }],
        });
        break;

      case "eyebrows":
        // type:"color" = keep user's own brow shape, just tint it.
        effects.push({
          category: "eyebrows",
          pattern: { type: "color" },
          palettes: [{ color: "#5C4033", colorIntensity: 60, texture: "matte" }],
        });
        break;
    }
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
        const rawBytes = new Uint8Array(await selfie.arrayBuffer());
        const { bytes, contentType } = await resizeForPC(rawBytes);
        const fileName = "selfie.jpg";

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
