// Edge Function: extract-front-info
//
// Input  : { storage_path: string, category: "makeup" | "skincare" }
// Output : { data: { name, brand, subcategory, shade } } — each field nullable
// Errors : { error: { code, message } }
//
// Soft-fail policy: if Gemini errors or returns garbage after the stricter
// retry, return all-nulls so the user can fill in the preview step instead of
// seeing a 500. The Vietnamese flow doc calls for "return empty → user types
// in preview" rather than retry prompts.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { frontInfoPrompt, frontInfoPromptStricter } from "../_shared/prompts.ts";
import { frontInfo, frontInfoBody } from "../_shared/schemas.ts";
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

    const parsed = frontInfoBody.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse("invalid_request", parsed.error.message, 400);
    }
    const { storage_path: storagePath, category } = parsed.data;

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

    let info;
    try {
      info = await callGeminiJson({
        prompt: frontInfoPrompt(category),
        retryPrompt: frontInfoPromptStricter(category),
        image: { mimeType, bytes },
        geminiSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", nullable: true },
            brand: { type: "STRING", nullable: true },
            subcategory: { type: "STRING", nullable: true },
            shade: { type: "STRING", nullable: true },
          },
          required: ["name", "brand", "subcategory", "shade"],
        },
        validator: frontInfo,
      });
    } catch (err) {
      console.warn("front-info extract fell through after retry; returning nulls:", err);
      info = { name: null, brand: null, subcategory: null, shade: null };
    }

    return jsonResponse({ data: info });
  } catch (err) {
    console.error("extract-front-info error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
