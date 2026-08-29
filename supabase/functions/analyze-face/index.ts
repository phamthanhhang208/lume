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
  eye_shape: string | null;
  eyelid: string | null;
  eyebrow_shape: string | null;
  lip_shape: string | null;
}

// Which face-attr-analysis features we request, and which summary key each
// lands on. Existing users with a face_shape-only face_data won't refresh
// automatically (the client only calls this when face_data is null) — a
// re-scan on a fresh account picks up the full set.
const FEATURES: Array<{ feature: string; key: keyof FaceSummary }> = [
  { feature: "faceShape", key: "face_shape" },
  { feature: "eyeShape", key: "eye_shape" },
  { feature: "eyelid", key: "eyelid" },
  { feature: "eyebrowShape", key: "eyebrow_shape" },
  { feature: "lipShape", key: "lip_shape" },
];

function pickString(source: unknown, ...keys: string[]): string | null {
  if (!source || typeof source !== "object") return null;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

// Each requested feature may come back as a bare string or an object like
// { value: "oval" }, keyed by the camelCase feature name.
function extractFeature(result: Record<string, unknown>, feature: string): string | null {
  const node = result[feature];
  if (typeof node === "string" && node.length > 0) return node.toLowerCase();
  const nested = pickString(node, "value", "type", "name");
  return nested ? nested.toLowerCase() : null;
}

function summarize(raw: unknown): FaceSummary {
  const empty: FaceSummary = {
    face_shape: null,
    eye_shape: null,
    eyelid: null,
    eyebrow_shape: null,
    lip_shape: null,
  };
  if (!raw || typeof raw !== "object") return empty;
  const obj = raw as Record<string, unknown>;
  const result =
    (obj.result as Record<string, unknown> | undefined) ??
    (obj.face as Record<string, unknown> | undefined) ??
    obj;
  const out = { ...empty };
  for (const { feature, key } of FEATURES) {
    out[key] = extractFeature(result, feature);
  }
  // Legacy fallback for face shape keys seen in earlier responses.
  if (!out.face_shape) {
    const shape = pickString(result, "face_shape", "shape");
    out.face_shape = shape ? shape.toLowerCase() : null;
  }
  return out;
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
      featureName: "face-attr-analysis",
      bytes,
      contentType,
      fileName,
      taskParams: { features: FEATURES.map((f) => f.feature) },
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
