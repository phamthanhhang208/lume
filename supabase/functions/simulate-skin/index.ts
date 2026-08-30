// Edge Function: simulate-skin
//
// Input  : { scan_id: string, product_ids?: string[] }
// Output : { data: { simulation_image_url, cached, routine_conditioned,
//                    concerns_simulated, concerns_uncovered,
//                    coverage_reasoning } }
// Errors : { error: { code, message } }
//
// Renders a "your skin in 4 weeks" preview with Perfect Corp Skin
// Simulation. The products driving the estimate come from, in order:
//   1. an explicit product_ids selection (cache bypassed — every selection
//      gets a fresh render),
//   2. the scan's "works" verdicts (routine-conditioned, the default), or
//   3. a metric-severity fallback when neither exists.
// In modes 1-2 Gemini estimates a per-concern intensity from the products'
// ingredients; concerns below 0.3 are reported as uncovered so the UI can
// say what the routine does NOT address. Cached on
// scans.simulation_image_url for the no-selection path.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { z } from "npm:zod@4";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { simulateSkinBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

// PC skin-simulation spec: short side >= 480 px, long side <= 2560 px,
// face >= 60% of image width. For selfies framed at face-level, the face
// already fills 60%+ of the frame, so we just downscale to fit the long-side
// cap — no crop needed.
const PC_MAX_LONG_SIDE = 2560;

// Minimal EXIF orientation reader for JPEG. Returns 1 if absent/unparseable.
// PC ignores EXIF, so we must bake orientation into pixels before upload.
function readExifOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1];
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1 && offset + 10 < bytes.length) {
      const exifSig =
        bytes[offset + 4] === 0x45 &&
        bytes[offset + 5] === 0x78 &&
        bytes[offset + 6] === 0x69 &&
        bytes[offset + 7] === 0x66;
      if (exifSig) {
        const tiff = offset + 10;
        const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
        const get16 = (o: number) =>
          little
            ? bytes[o] | (bytes[o + 1] << 8)
            : (bytes[o] << 8) | bytes[o + 1];
        const get32 = (o: number) =>
          little
            ? bytes[o] |
              (bytes[o + 1] << 8) |
              (bytes[o + 2] << 16) |
              (bytes[o + 3] << 24)
            : (bytes[o] << 24) |
              (bytes[o + 1] << 16) |
              (bytes[o + 2] << 8) |
              bytes[o + 3];
        const ifd = tiff + get32(tiff + 4);
        const n = get16(ifd);
        for (let i = 0; i < n; i++) {
          const entry = ifd + 2 + i * 12;
          if (get16(entry) === 0x0112) return get16(entry + 8);
        }
      }
    }
    offset += 2 + size;
  }
  return 1;
}

async function normalizeForPC(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const orientation = readExifOrientation(bytes);
  const img = await Image.decode(bytes);

  // Bake EXIF orientation into pixels. Skipping flip-only modes (2,4,5,7) —
  // selfie cameras virtually always produce 1/3/6/8. NOTE: imagescript's
  // rotate(angle) goes counter-clockwise, so we invert from EXIF's CW convention.
  if (orientation === 3) img.rotate(180);
  else if (orientation === 6) img.rotate(270); // EXIF 6 = 90° CW = 270° CCW
  else if (orientation === 8) img.rotate(90); // EXIF 8 = 270° CW = 90° CCW

  // Downscale to fit PC's 2560 long-side cap, preserving aspect.
  const longSide = Math.max(img.width, img.height);
  if (longSide > PC_MAX_LONG_SIDE) {
    const scale = PC_MAX_LONG_SIDE / longSide;
    img.resize(Math.floor(img.width * scale), Math.floor(img.height * scale));
  }
  const out = await img.encodeJPEG(85);
  console.log(
    `simulate-skin: orientation=${orientation}, final ${img.width}x${img.height}`,
  );
  return { bytes: out, contentType: "image/jpeg" };
}

// Per PC docs + sample: task body is { src_file_id, <concern>: intensity, ... }
// — concerns are flat top-level keys, not wrapped in dst_actions/params.
// All 10 concerns must be present (use 0.0 to skip); at least one > 0.0.
// Intensity is 0.0–1.0 (0 = no change, 1.0 = max natural correction).
const PC_CONCERNS = [
  "wrinkle",
  "radiance",
  "oiliness",
  "acne",
  "eye_bags",
  "dark_circle",
  "spots",
  "pores",
  "texture",
  "redness",
] as const;

// Map our normalized metric keys (from analyze-skin/extractMetrics) to PC's
// concern vocabulary. Metrics with no PC mapping (firmness, moisture,
// droopy_eyelid) are omitted from the score-based selection.
const METRIC_TO_CONCERN: Record<string, string> = {
  wrinkle: "wrinkle",
  pore: "pores",
  acne: "acne",
  redness: "redness",
  dark_circle: "dark_circle",
  eye_bag: "eye_bags",
  radiance: "radiance",
  age_spot: "spots",
  texture: "texture",
  oiliness: "oiliness",
};

const CONCERN_TO_METRIC: Record<string, string> = Object.fromEntries(
  Object.entries(METRIC_TO_CONCERN).map(([m, c]) => [c, m]),
);

const LOW_SCORE_CUTOFF = 85;
const MAX_CONCERNS = 5;
// Below this Gemini intensity a concern counts as "not covered" by the
// products, for the coverage chips.
const COVERED_THRESHOLD = 0.3;

// Gemini returns one intensity per PC concern (+ a short reasoning line).
const intensitiesSchema = z.object({
  ...(Object.fromEntries(
    PC_CONCERNS.map((c) => [c, z.number().min(0).max(1)]),
  ) as Record<(typeof PC_CONCERNS)[number], z.ZodNumber>),
  reasoning: z.string().optional().default(""),
});

interface ProductForPrompt {
  name: string | null;
  brand: string | null;
  ingredients: string[] | null;
}

function buildGeminiPrompt(
  metrics: Record<string, number>,
  products: ProductForPrompt[],
): string {
  const metricLines = Object.entries(metrics)
    .filter(([, v]) => typeof v === "number")
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n");
  const productLines = products
    .map((p, i) => {
      const name = `${p.brand ?? ""} ${p.name ?? ""}`.trim() || "(unnamed)";
      const ingredients =
        p.ingredients && p.ingredients.length > 0
          ? p.ingredients.slice(0, 30).join(", ")
          : "(no ingredients listed)";
      return `  ${i + 1}. ${name}\n     ingredients: ${ingredients}`;
    })
    .join("\n");

  return `You are a dermatologist estimating how a user's skin will look after 4 weeks of consistent use of the following skincare products.

Current skin scores (0-100, lower = worse):
${metricLines}

Products committed to:
${productLines}

For each of these 10 skin concerns, return a simulation intensity (0.0-1.0). The intensity drives a before/after image preview: 0.0 = no visible change, 1.0 = maximum natural-looking correction. Be realistic — only assign meaningful intensity (>0.3) to concerns the products' active ingredients actually address. Concerns scoring above 85 don't need much change. At least one concern must be > 0.

Concerns: ${PC_CONCERNS.join(", ")}

Return JSON with all 10 concern keys plus "reasoning": one sentence naming which product addresses what.`;
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
    const { scan_id: scanId, product_ids: productIds } = parsed.data;
    const hasSelection = !!productIds && productIds.length > 0;

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

    // Bypass cache when product selection is provided — each selection should
    // produce a fresh simulation reflecting those products' effects. Coverage
    // details are not persisted; a cached hit returns just the image.
    if (!hasSelection && scan.simulation_image_url) {
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

    const metrics = (scan.metrics ?? {}) as Record<string, number>;
    // Low-scoring metrics, mapped to PC concerns — the set the chips report on.
    const lowConcernEntries = Object.entries(metrics)
      .filter(
        (entry): entry is [string, number] =>
          entry[0] in METRIC_TO_CONCERN &&
          typeof entry[1] === "number" &&
          Number.isFinite(entry[1]) &&
          entry[1] < LOW_SCORE_CUTOFF,
      )
      .sort(([, a], [, b]) => a - b)
      .slice(0, MAX_CONCERNS);

    // Resolve which products drive the estimate.
    let products: ProductForPrompt[] | null = null;
    let routineConditioned = false;
    if (hasSelection) {
      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("name, brand, ingredients")
        .in("id", productIds!)
        .eq("category", "skincare");
      if (prodErr) throw prodErr;
      if (!prods || prods.length === 0) {
        return errorResponse("no_products", "selected products not found", 400);
      }
      products = prods as ProductForPrompt[];
    } else {
      // Routine conditioning: use the scan's "works" verdicts as the implied
      // selection. Soft-fails to the metric-based fallback. Note: a cached
      // simulation goes stale if verdicts are regenerated on the same scan —
      // acceptable, a re-scan creates a fresh cache.
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
          const { data: prods, error: prodErr } = await supabase
            .from("products")
            .select("name, brand, ingredients")
            .in("id", worksIds);
          if (prodErr) throw prodErr;
          if (prods && prods.length > 0) {
            products = prods as ProductForPrompt[];
            routineConditioned = true;
          }
        }
      } catch (err) {
        console.warn("works-verdict lookup failed (metric fallback):", err);
      }
    }

    let intensities: Record<string, number>;
    let coverageReasoning: string | null = null;
    if (products) {
      try {
        const fromGemini = await callGeminiJson({
          prompt: buildGeminiPrompt(metrics, products),
          geminiSchema: {
            type: "OBJECT",
            properties: {
              ...Object.fromEntries(
                PC_CONCERNS.map((c) => [c, { type: "NUMBER" }]),
              ),
              reasoning: { type: "STRING" },
            },
            required: [...PC_CONCERNS],
          },
          validator: intensitiesSchema,
        });
        const { reasoning, ...concernValues } = fromGemini;
        intensities = concernValues;
        coverageReasoning = reasoning || null;
        console.log("simulate-skin: gemini intensities:", JSON.stringify(intensities));
      } catch (err) {
        console.warn("gemini intensities failed (metric fallback):", err);
        products = null;
        routineConditioned = false;
        intensities = {};
      }
    } else {
      intensities = {};
    }

    if (!products) {
      // Fallback: metric-based selection (5 lowest concerns).
      intensities = Object.fromEntries(PC_CONCERNS.map((c) => [c, 0]));
      for (const [key, score] of lowConcernEntries) {
        const concern = METRIC_TO_CONCERN[key];
        const raw = (LOW_SCORE_CUTOFF - score) / LOW_SCORE_CUTOFF;
        intensities[concern] = Math.min(1, Math.max(0.3, Number(raw.toFixed(2))));
      }
    }

    // Coverage chips: of the user's low-scoring concerns, which does the
    // simulation meaningfully address?
    const concernsSimulated: string[] = [];
    const concernsUncovered: string[] = [];
    for (const [metricKey] of lowConcernEntries) {
      const concern = METRIC_TO_CONCERN[metricKey];
      if ((intensities[concern] ?? 0) >= COVERED_THRESHOLD) {
        concernsSimulated.push(metricKey);
      } else {
        concernsUncovered.push(metricKey);
      }
    }

    const anyIntensity = Object.values(intensities).some((v) => v > 0);
    if (!anyIntensity) {
      // Nothing to render honestly (no low concerns, or the routine covers
      // none of them) — skip the Perfect Corp call entirely.
      return jsonResponse({
        data: {
          simulation_image_url: null,
          cached: false,
          routine_conditioned: routineConditioned,
          concerns_simulated: [],
          concerns_uncovered: concernsUncovered,
          coverage_reasoning: coverageReasoning,
        },
      });
    }

    const { data: selfie, error: dlErr } = await supabase.storage
      .from("selfies")
      .download(scan.image_url);
    if (dlErr || !selfie) {
      return errorResponse("download_failed", dlErr?.message ?? "no blob", 500);
    }
    const rawBytes = new Uint8Array(await selfie.arrayBuffer());
    const { bytes, contentType } = await normalizeForPC(rawBytes);
    const fileName = scan.image_url.split("/").pop() ?? "selfie.jpg";

    console.log("simulate-skin: intensities:", JSON.stringify(intensities));

    const resultUrl = await runPerfectCorpTask({
      featureName: "skin-simulation",
      bytes,
      contentType,
      fileName,
      taskParams: intensities,
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
        concerns_simulated: concernsSimulated,
        concerns_uncovered: concernsUncovered,
        coverage_reasoning: coverageReasoning,
      },
    });
  } catch (err) {
    console.error("simulate-skin error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
