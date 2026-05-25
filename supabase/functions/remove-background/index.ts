// Edge Function: remove-background
//
// Input  : { storage_path: string }  - path under the `products` bucket,
//                                       owned by the calling user
// Output : { data: { result_url: string } }  - Perfect Corp URL (~24h TTL);
//                                               client fetches + reuploads
// Errors : { error: { code, message } }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { storagePathBody } from "../_shared/schemas.ts";
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
    const contentType = blob.type || "image/jpeg";
    const fileName = storagePath.split("/").pop() ?? "image.jpg";

    const resultUrl = await runPerfectCorpTask({
      // Perfect Corp's URL slug for AI Photo Background Removal is `sod`
      // (subject/object detection). The friendly name in the docs doesn't
      // match the URL slug — only `sod` returns 200 from /s2s/v2.0/file/.
      featureName: "sod",
      bytes,
      contentType,
      fileName,
    });

    return jsonResponse({ data: { result_url: resultUrl } });
  } catch (err) {
    console.error("remove-background error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
