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

// All 10 concern keys PC's skin-simulation accepts. Order matches the curl
// example in the docs; defaults to 0.0 for concerns we don't want to correct.
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

const LOW_SCORE_CUTOFF = 85;
const MAX_CONCERNS = 5;

// Gemini returns one intensity per PC concern. Schema generated from PC_CONCERNS.
const intensitiesSchema = z.object(
  Object.fromEntries(PC_CONCERNS.map((c) => [c, z.number().min(0).max(1)])) as
    Record<(typeof PC_CONCERNS)[number], z.ZodNumber>,
);

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

Return JSON with all 10 keys.`;
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
    // produce a fresh simulation reflecting those products' effects.
    if (!hasSelection && scan.simulation_image_url) {
      return jsonResponse({
        data: {
          simulation_image_url: scan.simulation_image_url,
          concerns_simulated: [],
          cached: true,
        },
      });
    }

    const metrics = (scan.metrics ?? {}) as Record<string, number>;
    let intensities: Record<string, number>;

    if (hasSelection) {
      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("name, brand, ingredients")
        .in("id", productIds!)
        .eq("category", "skincare");
      if (prodErr) throw prodErr;
      if (!prods || prods.length === 0) {
        return errorResponse(
          "no_products",
          "selected products not found",
          400,
        );
      }
      const fromGemini = await callGeminiJson({
        prompt: buildGeminiPrompt(metrics, prods as ProductForPrompt[]),
        geminiSchema: {
          type: "OBJECT",
          properties: Object.fromEntries(
            PC_CONCERNS.map((c) => [c, { type: "NUMBER" }]),
          ),
          required: [...PC_CONCERNS],
        },
        validator: intensitiesSchema,
      });
      intensities = { ...fromGemini };
      console.log(
        "simulate-skin: gemini intensities:",
        JSON.stringify(intensities),
      );
    } else {
      // Fallback: metric-based selection (5 lowest concerns).
      const lowConcerns = Object.entries(metrics)
        .filter(
          (entry): entry is [string, number] =>
            entry[0] in METRIC_TO_CONCERN &&
            typeof entry[1] === "number" &&
            Number.isFinite(entry[1]) &&
            entry[1] < LOW_SCORE_CUTOFF,
        )
        .sort(([, a], [, b]) => a - b)
        .slice(0, MAX_CONCERNS);
      intensities = Object.fromEntries(PC_CONCERNS.map((c) => [c, 0]));
      for (const [key, score] of lowConcerns) {
        const concern = METRIC_TO_CONCERN[key];
        const raw = (LOW_SCORE_CUTOFF - score) / LOW_SCORE_CUTOFF;
        const intensity = Math.min(1, Math.max(0.3, Number(raw.toFixed(2))));
        intensities[concern] = intensity;
      }
    }

    const concerns = Object.entries(intensities)
      .filter(([, v]) => v > 0)
      .map(([k]) => k);

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
