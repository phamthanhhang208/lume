// Edge Function: analyze-skin
//
// Input  : { storage_path: string }  - path under the `selfies` bucket,
//                                      owned by the calling user
// Output : { data: { metrics, skin_age, overall_score, raw_response } }
// Errors : { error: { code, message } }
//
// Calls Perfect Corp Skin Analysis V2.1. The task result URL points to a
// JSON document; we fetch it, normalize the 13 metrics we care about, and
// return the raw response alongside so we can re-parse later if needed.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { storagePathBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

const METRIC_KEYS = [
  "wrinkle",
  "pore",
  "acne",
  "redness",
  "oiliness",
  "moisture",
  "dark_circle",
  "eye_bag",
  "firmness",
  "radiance",
  "age_spot",
  "texture",
  "droopy_eyelid",
] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

function pickNumber(source: unknown, ...keys: string[]): number {
  if (!source || typeof source !== "object") return 0;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function extractMetrics(raw: unknown): Record<MetricKey, number> {
  if (!raw || typeof raw !== "object") {
    return Object.fromEntries(METRIC_KEYS.map((k) => [k, 0])) as Record<MetricKey, number>;
  }
  const root = raw as Record<string, unknown>;
  // Perfect Corp typically nests scores under "scores" / "score" / "result".
  const scores =
    (root.scores as Record<string, unknown> | undefined) ??
    (root.score as Record<string, unknown> | undefined) ??
    (root.result as Record<string, unknown> | undefined) ??
    root;
  const out = {} as Record<MetricKey, number>;
  for (const key of METRIC_KEYS) {
    out[key] = pickNumber(scores, key, `${key}_score`);
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
      featureName: "skin-analysis",
      bytes,
      contentType,
      fileName,
      taskParams: { dst_actions: ["HD"] },
    });

    const resultRes = await fetch(resultUrl);
    if (!resultRes.ok) {
      throw new Error(`fetch analysis result ${resultRes.status}: ${resultRes.statusText}`);
    }
    const raw = (await resultRes.json()) as Record<string, unknown>;
    console.log("skin-analysis raw:", JSON.stringify(raw).slice(0, 2000));

    const metrics = extractMetrics(raw);
    const skin_age = pickNumber(raw, "skin_age", "age");
    const overall_score = pickNumber(raw, "overall_score", "score", "total_score");

    return jsonResponse({
      data: { metrics, skin_age, overall_score, raw_response: raw },
    });
  } catch (err) {
    console.error("analyze-skin error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
