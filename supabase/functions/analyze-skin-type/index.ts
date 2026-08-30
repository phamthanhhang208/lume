// Edge Function: analyze-skin-type
//
// Input  : { storage_path: string }  - path under the `selfies` bucket
// Output : { data: { skin_type, raw_response } }
// Errors : { error: { code, message } }
//
// Runs Perfect Corp Fitzpatrick Skin Type Analysis (segment
// fitzpatrick-scale-analyzer, verified against the YouCam MCP catalog).
// Returns a flattened { fitzpatrick_type } alongside the raw response.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { storagePathBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

interface SkinTypeSummary {
  fitzpatrick_type: string | null;
}

const VALID_TYPES = new Set(["I", "II", "III", "IV", "V", "VI"]);

function normalizeType(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6) {
    return ["I", "II", "III", "IV", "V", "VI"][value - 1];
  }
  if (typeof value !== "string" || value.length === 0) return null;
  const upper = value.toUpperCase().replace(/^TYPE\s*/, "").trim();
  if (VALID_TYPES.has(upper)) return upper;
  const num = Number.parseInt(upper, 10);
  if (Number.isInteger(num) && num >= 1 && num <= 6) {
    return ["I", "II", "III", "IV", "V", "VI"][num - 1];
  }
  return null;
}

function summarize(raw: unknown): SkinTypeSummary {
  if (!raw || typeof raw !== "object") return { fitzpatrick_type: null };
  const obj = raw as Record<string, unknown>;
  const result =
    (obj.result as Record<string, unknown> | undefined) ??
    (obj.skin_type as Record<string, unknown> | undefined) ??
    obj;
  for (const key of ["fitzpatrick_type", "fitzpatrickType", "skin_type", "skinType", "type"]) {
    const normalized = normalizeType((result as Record<string, unknown>)[key]);
    if (normalized) return { fitzpatrick_type: normalized };
  }
  return { fitzpatrick_type: null };
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
      featureName: "fitzpatrick-scale-analyzer",
      bytes,
      contentType,
      fileName,
    });

    const resultRes = await fetch(resultUrl);
    if (!resultRes.ok) {
      throw new Error(`fetch skin-type result ${resultRes.status}: ${resultRes.statusText}`);
    }
    const raw = (await resultRes.json()) as Record<string, unknown>;
    console.log("fitzpatrick raw:", JSON.stringify(raw).slice(0, 2000));

    return jsonResponse({ data: { skin_type: summarize(raw), raw_response: raw } });
  } catch (err) {
    console.error("analyze-skin-type error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
