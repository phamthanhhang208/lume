// Edge Function: extract-ingredients
//
// Input  : { storage_path: string }
// Output : { data: { ingredients: string[] } }
// Errors : { error: { code, message } }
//
// Per docs/flows.md Flow 1 failure modes: if Gemini returns garbage after
// the retry-once-stricter step, soft-fail to an empty list so the user can
// hand-type instead of seeing a 500.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { ingredientOcrPrompt, ingredientOcrPromptStricter } from "../_shared/prompts.ts";
import { ingredientList, storagePathBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("invalid_json", "request body is not valid JSON", 400);
    }

    const parsed = storagePathBody.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse("invalid_request", parsed.error.message, 400);
    }
    const { storage_path: storagePath } = parsed.data;

    if (!storagePath.startsWith(`${userId}/`)) {
      return errorResponse("forbidden", "cannot access this path", 403);
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from("products")
      .download(storagePath);
    if (dlErr || !blob) {
      return errorResponse("download_failed", dlErr?.message ?? "no blob", 500);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mimeType = blob.type || "image/jpeg";

    let ingredients: string[];
    try {
      ingredients = await callGeminiJson({
        prompt: ingredientOcrPrompt(),
        retryPrompt: ingredientOcrPromptStricter(),
        image: { mimeType, bytes },
        geminiSchema: { type: "ARRAY", items: { type: "STRING" } },
        validator: ingredientList,
      });
    } catch (err) {
      console.warn("OCR fell through after retry; returning []:", err);
      ingredients = [];
    }

    return jsonResponse({ data: { ingredients } });
  } catch (err) {
    console.error("extract-ingredients error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
