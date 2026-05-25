// Edge Function: simulate-skin
//
// Input  : { scan_id: string }
// Output : { data: { simulation_image_url, concerns_simulated, cached } }
// Errors : { error: { code, message } }
//
// Reads the user's scan, derives the 5 lowest-scoring skin concerns, asks
// Perfect Corp Skin Simulation to render an after-image of those concerns
// improving, and caches the result on scans.simulation_image_url. Idempotent:
// a second call returns the cached image without re-spending Perfect Corp
// quota.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { simulateSkinBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

// taskParams: { concerns }   ← flat, no `params` wrapper (PC API requires this)

// Map our normalized metric keys (from analyze-skin/extractMetrics) to the
// concern vocabulary that Perfect Corp Skin Simulation accepts. Keys we don't
// have a clean mapping for (e.g. droopy_eyelid) are left out — those concerns
// just won't be simulated.
const METRIC_TO_CONCERN: Record<string, string> = {
  wrinkle: "wrinkle",
  pore: "pore",
  acne: "acne",
  redness: "redness",
  dark_circle: "dark_circle",
  eye_bag: "eye_bag",
  firmness: "firmness",
  radiance: "radiance",
  age_spot: "age_spot",
  texture: "texture",
  oiliness: "oiliness",
  moisture: "moisture",
};

const LOW_SCORE_CUTOFF = 85;
const MAX_CONCERNS = 5;

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
      return jsonResponse({
        data: {
          simulation_image_url: scan.simulation_image_url,
          concerns_simulated: [],
          cached: true,
        },
      });
    }

    const metrics = (scan.metrics ?? {}) as Record<string, unknown>;
    const concerns = Object.entries(metrics)
      .filter(
        (entry): entry is [string, number] =>
          entry[0] in METRIC_TO_CONCERN &&
          typeof entry[1] === "number" &&
          Number.isFinite(entry[1]) &&
          entry[1] < LOW_SCORE_CUTOFF,
      )
      .sort(([, a], [, b]) => a - b)
      .slice(0, MAX_CONCERNS)
      .map(([key]) => METRIC_TO_CONCERN[key]);

    if (concerns.length === 0) {
      return jsonResponse({
        data: {
          simulation_image_url: null,
          concerns_simulated: [],
          cached: false,
        },
      });
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

    console.log("simulate-skin: concerns selected:", JSON.stringify(concerns));

    const resultUrl = await runPerfectCorpTask({
      featureName: "skin-simulation",
      bytes,
      contentType,
      fileName,
      // No extra taskParams — skin-simulation auto-detects concerns from the image.
      // Sending dst_actions or concerns both cause InvalidParameters (not violation).
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
        concerns_simulated: concerns,
        cached: false,
      },
    });
  } catch (err) {
    console.error("simulate-skin error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
