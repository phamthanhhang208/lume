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
import { strFromU8, unzipSync } from "npm:fflate@0.8.2";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { storagePathBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

// Each entry maps the metric key we expose to the client to the Perfect Corp
// HD action name(s) requested in dst_actions. droopy_eyelid combines PC's
// upper + lower scores into a single value.
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

const METRIC_TO_PC_ACTIONS: Record<MetricKey, readonly string[]> = {
  wrinkle: ["hd_wrinkle"],
  pore: ["hd_pore"],
  acne: ["hd_acne"],
  redness: ["hd_redness"],
  oiliness: ["hd_oiliness"],
  moisture: ["hd_moisture"],
  dark_circle: ["hd_dark_circle"],
  eye_bag: ["hd_eye_bag"],
  firmness: ["hd_firmness"],
  radiance: ["hd_radiance"],
  age_spot: ["hd_age_spot"],
  texture: ["hd_texture"],
  droopy_eyelid: ["hd_droopy_upper_eyelid", "hd_droopy_lower_eyelid"],
};

const PC_ACTIONS = Array.from(
  new Set(Object.values(METRIC_TO_PC_ACTIONS).flat()),
);

// PC returns each action as either { ui_score, raw_score, ... } (simple
// metrics like redness, age_spot) or as a region map { forehead: {...},
// nose: {...}, whole: {...} } (pore, wrinkle, texture, acne). We always
// prefer ui_score (the 0-100 normalized one), falling back to .whole.ui_score
// for the nested shape.
function extractScore(scores: Record<string, unknown>, action: string): number {
  const entry = scores[action];
  if (!entry || typeof entry !== "object") return 0;
  const obj = entry as Record<string, unknown>;
  if (typeof obj.ui_score === "number") return obj.ui_score;
  const whole = obj.whole as Record<string, unknown> | undefined;
  if (whole && typeof whole.ui_score === "number") return whole.ui_score;
  return 0;
}

function extractMetrics(raw: unknown): Record<MetricKey, number> {
  if (!raw || typeof raw !== "object") {
    return Object.fromEntries(METRIC_KEYS.map((k) => [k, 0])) as Record<MetricKey, number>;
  }
  const scores = raw as Record<string, unknown>;
  const out = {} as Record<MetricKey, number>;
  for (const key of METRIC_KEYS) {
    const pcActions = METRIC_TO_PC_ACTIONS[key];
    const values = pcActions
      .map((action) => extractScore(scores, action))
      .filter((v) => v > 0);
    // droopy_eyelid: average the upper + lower scores if both are present
    out[key] = values.length === 0
      ? 0
      : Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }
  return out;
}

function pickOverallScore(raw: Record<string, unknown>): number {
  const all = raw.all as Record<string, unknown> | undefined;
  if (all && typeof all.score === "number") return Math.round(all.score);
  return 0;
}

function pickSkinAge(raw: Record<string, unknown>): number {
  if (typeof raw.skin_age === "number") return Math.round(raw.skin_age);
  if (typeof raw.age === "number") return Math.round(raw.age);
  return 0;
}

async function fetchAndExtractAnalysisJson(
  resultUrl: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(resultUrl);
  if (!res.ok) {
    throw new Error(`fetch analysis result ${res.status}: ${res.statusText}`);
  }
  const zipBytes = new Uint8Array(await res.arrayBuffer());
  const entries = unzipSync(zipBytes);
  const jsonName = Object.keys(entries).find((n) => n.toLowerCase().endsWith(".json"));
  if (!jsonName) {
    throw new Error(
      `no JSON file in PC zip; entries: ${Object.keys(entries).join(", ")}`,
    );
  }
  return JSON.parse(strFromU8(entries[jsonName])) as Record<string, unknown>;
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
      taskParams: { dst_actions: PC_ACTIONS },
    });

    const raw = await fetchAndExtractAnalysisJson(resultUrl);
    console.log("skin-analysis raw:", JSON.stringify(raw).slice(0, 2000));

    const metrics = extractMetrics(raw);
    const skin_age = pickSkinAge(raw);
    const overall_score = pickOverallScore(raw);

    return jsonResponse({
      data: { metrics, skin_age, overall_score, raw_response: raw },
    });
  } catch (err) {
    console.error("analyze-skin error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
