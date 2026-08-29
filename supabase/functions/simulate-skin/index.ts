// Edge Function: simulate-skin
//
// Input  : { scan_id: string }
// Output : { data: { simulation_image_url, cached, routine_conditioned,
//                    concerns_simulated, concerns_uncovered,
//                    coverage_reasoning } }
// Errors : { error: { code, message } }
//
// Reads the user's scan, derives the 5 lowest-scoring skin concerns, and —
// when the scan has verdicts — asks Gemini which of them the "works"
// products actually address, simulating only those (the rest are reported
// as uncovered). Perfect Corp Skin Simulation renders the after-image,
// cached on scans.simulation_image_url. Idempotent: a second call returns
// the cached image without re-spending Perfect Corp quota.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import {
  routineCoveragePrompt,
  routineCoveragePromptStricter,
} from "../_shared/prompts.ts";
import { routineCoverage, simulateSkinBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

// Map our normalized metric keys (from analyze-skin/extractMetrics) to the
// Skin Simulation task params. Each param is a float 0.0-1.0 sent at the top
// level of the task body, where 1.0 means "most improved". Keys without a
// clean mapping (droopy_eyelid, moisture, firmness) are left out, and
// oiliness is deliberately excluded — for that param 1.0 ADDS shine.
const METRIC_TO_SIM_PARAM: Record<string, string> = {
  wrinkle: "wrinkle",
  pore: "pores",
  acne: "acne",
  redness: "redness",
  dark_circle: "dark_circle",
  eye_bag: "eye_bags",
  radiance: "radiance",
  age_spot: "spots",
  texture: "texture",
};

const LOW_SCORE_CUTOFF = 60;
const MAX_CONCERNS = 5;

/** Lower score → stronger simulated improvement, clamped to [0.3, 1]. */
function improvementIntensity(score: number): number {
  const raw = (100 - score) / 100;
  return Math.round(Math.min(1, Math.max(0.3, raw)) * 100) / 100;
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
    const parsed = simulateSkinBody.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse("invalid_request", parsed.error.message, 400);
    }
    const { scan_id: scanId } = parsed.data;

    const { data: scan, error: scanErr } = await supabase
      .from("scans")
      .select("id, user_id, image_url, metrics, simulation_image_url")
      .eq("id", scanId)
      .maybeSingle();
    if (scanErr) throw scanErr;
    if (!scan) return errorResponse("not_found", "scan not found", 404);
    if (scan.user_id !== userId) {
      return errorResponse("forbidden", "not your scan", 403);
    }

    if (scan.simulation_image_url) {
      // Coverage details are not persisted; a cached hit returns just the
      // image (chips render only right after a fresh generation).
      return jsonResponse({
        data: {
          simulation_image_url: scan.simulation_image_url,
          cached: true,
          routine_conditioned: false,
          concerns_simulated: [],
          concerns_uncovered: [],
          coverage_reasoning: null,
        },
      });
    }

    const metrics = (scan.metrics ?? {}) as Record<string, unknown>;
    const lowMetrics = Object.entries(metrics)
      .filter(
        (entry): entry is [string, number] =>
          entry[0] in METRIC_TO_SIM_PARAM &&
          typeof entry[1] === "number" &&
          Number.isFinite(entry[1]) &&
          entry[1] < LOW_SCORE_CUTOFF,
      )
      .sort(([, a], [, b]) => a - b)
      .slice(0, MAX_CONCERNS);
    const lowConcerns = lowMetrics.map(([key]) => key);

    if (lowConcerns.length === 0) {
      return jsonResponse({
        data: {
          simulation_image_url: null,
          cached: false,
          routine_conditioned: false,
          concerns_simulated: [],
          concerns_uncovered: [],
          coverage_reasoning: null,
        },
      });
    }

    // Routine conditioning: if this scan has verdicts, ask Gemini which of
    // the low concerns the "works" products actually address, and simulate
    // only those. Soft-fails back to simulating every low concern.
    // Note: a cached simulation goes stale if verdicts are regenerated on
    // the same scan — acceptable, a re-scan creates a fresh cache.
    let routineConditioned = false;
    let coveredConcerns = lowConcerns;
    let coverageReasoning: string | null = null;
    try {
      const { data: worksVerdicts, error: verdictsErr } = await supabase
        .from("verdicts")
        .select("product_id")
        .eq("scan_id", scanId)
        .eq("verdict", "works");
      if (verdictsErr) throw verdictsErr;
      const worksIds = (worksVerdicts ?? []).map(
        (v: { product_id: string }) => v.product_id,
      );
      if (worksIds.length > 0) {
        const { data: worksProducts, error: productsErr } = await supabase
          .from("products")
          .select("id, name, brand, category, subcategory, ingredients")
          .in("id", worksIds);
        if (productsErr) throw productsErr;
        if (worksProducts && worksProducts.length > 0) {
          const coverage = await callGeminiJson({
            prompt: routineCoveragePrompt(worksProducts, lowConcerns),
            retryPrompt: routineCoveragePromptStricter(worksProducts, lowConcerns),
            geminiSchema: {
              type: "OBJECT",
              properties: {
                covered: { type: "ARRAY", items: { type: "STRING" } },
                reasoning: { type: "STRING" },
              },
              required: ["covered", "reasoning"],
            },
            validator: routineCoverage,
          });
          routineConditioned = true;
          coveredConcerns = lowConcerns.filter((c) =>
            coverage.covered.includes(c),
          );
          coverageReasoning = coverage.reasoning;
        }
      }
    } catch (err) {
      console.warn("routine coverage failed (simulating all low concerns):", err);
    }

    const uncoveredConcerns = lowConcerns.filter(
      (c) => !coveredConcerns.includes(c),
    );

    // Routine covers none of the low concerns: skip the Perfect Corp call
    // entirely — there is nothing honest to render.
    if (coveredConcerns.length === 0) {
      return jsonResponse({
        data: {
          simulation_image_url: null,
          cached: false,
          routine_conditioned: routineConditioned,
          concerns_simulated: [],
          concerns_uncovered: uncoveredConcerns,
          coverage_reasoning: coverageReasoning,
        },
      });
    }

    const simParams: Record<string, number> = {};
    for (const [key, score] of lowMetrics) {
      if (!coveredConcerns.includes(key)) continue;
      simParams[METRIC_TO_SIM_PARAM[key]] = improvementIntensity(score);
    }

    const { data: selfie, error: dlErr } = await supabase.storage
      .from("selfies")
      .download(scan.image_url);
    if (dlErr || !selfie) {
      return errorResponse("download_failed", dlErr?.message ?? "no blob", 500);
    }
    const bytes = new Uint8Array(await selfie.arrayBuffer());
    const contentType = selfie.type || "image/jpeg";
    const fileName = scan.image_url.split("/").pop() ?? "selfie.jpg";

    const resultUrl = await runPerfectCorpTask({
      featureName: "skin-simulation",
      bytes,
      contentType,
      fileName,
      taskParams: simParams,
    });

    const imgRes = await fetch(resultUrl);
    if (!imgRes.ok) {
      throw new Error(`fetch simulation ${imgRes.status}: ${imgRes.statusText}`);
    }
    const imgBlob = await imgRes.blob();
    const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());

    const simPath = `${userId}/simulations/${scanId}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("selfies")
      .upload(simPath, imgBytes, {
        contentType: imgBlob.type || "image/jpeg",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { error: updErr } = await supabase
      .from("scans")
      .update({ simulation_image_url: simPath })
      .eq("id", scanId);
    if (updErr) throw updErr;

    return jsonResponse({
      data: {
        simulation_image_url: simPath,
        cached: false,
        routine_conditioned: routineConditioned,
        concerns_simulated: coveredConcerns,
        concerns_uncovered: uncoveredConcerns,
        coverage_reasoning: coverageReasoning,
      },
    });
  } catch (err) {
    console.error("simulate-skin error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
