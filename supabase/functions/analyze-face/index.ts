// Edge Function: analyze-face
//
// Input  : { storage_path: string }  - path under the `selfies` bucket
// Output : { data: { face, raw_response } }
// Errors : { error: { code, message } }
//
// Runs Perfect Corp Face Analyzer. The task produces a JSON document with
// detected face shape and landmark metadata. We flatten the face shape into
// a small object and return the raw response alongside in case the client
// wants more detail later.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { storagePathBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

interface FaceSummary {
  face_shape: string | null;
}

function pickString(source: unknown, ...keys: string[]): string | null {
  if (!source || typeof source !== "object") return null;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

function summarize(raw: unknown): FaceSummary {
  if (!raw || typeof raw !== "object") return { face_shape: null };
  const obj = raw as Record<string, unknown>;
  const result =
    (obj.result as Record<string, unknown> | undefined) ??
    (obj.face as Record<string, unknown> | undefined) ??
    obj;
  const shape = pickString(result, "face_shape", "faceShape", "shape");
  return { face_shape: shape ? shape.toLowerCase() : null };
}

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
      .from("selfies")
      .download(storagePath);
    if (dlErr || !blob) {
      return errorResponse("download_failed", dlErr?.message ?? "no blob", 500);
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const contentType = blob.type || "image/jpeg";
    const fileName = storagePath.split("/").pop() ?? "selfie.jpg";

    const resultUrl = await runPerfectCorpTask({
      featureName: "face-analyzer",
      bytes,
      contentType,
      fileName,
    });

    const resultRes = await fetch(resultUrl);
    if (!resultRes.ok) {
      throw new Error(`fetch face result ${resultRes.status}: ${resultRes.statusText}`);
    }
    const raw = (await resultRes.json()) as Record<string, unknown>;
    console.log("face-analyzer raw:", JSON.stringify(raw).slice(0, 2000));

    return jsonResponse({ data: { face: summarize(raw), raw_response: raw } });
  } catch (err) {
    console.error("analyze-face error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
