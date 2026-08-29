// Edge Function: check-shade
//
// Input  : { name, brand, shade }
// Output : { data: { verdict, note } }
// Errors : { error: { code, message } }
//
// Gemini-only sanity check for complexion products: given the product's
// shade name and the user's stored Perfect Corp skin tone analysis, flag a
// likely undertone/depth mismatch. Soft-fails to "unknown" — the UI shows
// nothing in that case and never blocks saving.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import {
  shadeCheckPrompt,
  shadeCheckPromptStricter,
  skinToneFrom,
} from "../_shared/prompts.ts";
import { checkShadeBody, shadeCheck } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { supabase } = auth;

    let rawBody: unknown;
    try { rawBody = await req.json(); }
    catch { return errorResponse("invalid_json", "request body is not valid JSON", 400); }

    const parsed = checkShadeBody.safeParse(rawBody);
    if (!parsed.success) return errorResponse("invalid_request", parsed.error.message, 400);
    const { name, brand, shade } = parsed.data;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("skin_tone_data")
      .maybeSingle();
    if (profileErr) throw profileErr;
    const tone = skinToneFrom(profile?.skin_tone_data);
    if (!tone?.skin_tone) {
      return jsonResponse({ data: { verdict: "unknown", note: null } });
    }

    try {
      const result = await callGeminiJson({
        prompt: shadeCheckPrompt(name, brand, shade, tone),
        retryPrompt: shadeCheckPromptStricter(name, brand, shade, tone),
        geminiSchema: {
          type: "OBJECT",
          properties: {
            verdict: {
              type: "STRING",
              enum: ["match", "too_warm", "too_cool", "too_light", "too_deep", "unknown"],
            },
            note: { type: "STRING", nullable: true },
          },
          required: ["verdict"],
        },
        validator: shadeCheck,
      });
      return jsonResponse({ data: result });
    } catch (err) {
      console.warn("shade check failed (soft-fail to unknown):", err);
      return jsonResponse({ data: { verdict: "unknown", note: null } });
    }
  } catch (err) {
    console.error("check-shade error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
