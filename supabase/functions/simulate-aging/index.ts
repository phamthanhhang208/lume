// Edge Function: simulate-aging
//
// Input  : { scan_id: string }
// Output : { data: { aging_image_url, cached } }
// Errors : { error: { code, message } }
//
// Runs Perfect Corp AI Aging on the scan's selfie. The task produces a
// series of images from youth to old age; we keep the last (oldest) frame
// as the "fast forward" preview and cache it on scans.aging_image_url.
// Idempotent: a second call returns the cached image without re-spending
// Perfect Corp quota.
//
// This is a generic aging simulation — it is NOT conditioned on the user's
// routine, and the UI copy must say so.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTaskAll } from "../_shared/perfectcorp.ts";
import { simulateSkinBody } from "../_shared/schemas.ts";
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
    const parsed = simulateSkinBody.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse("invalid_request", parsed.error.message, 400);
    }
    const { scan_id: scanId } = parsed.data;

    const { data: scan, error: scanErr } = await supabase
      .from("scans")
      .select("id, user_id, image_url, aging_image_url")
      .eq("id", scanId)
      .maybeSingle();
    if (scanErr) throw scanErr;
    if (!scan) return errorResponse("not_found", "scan not found", 404);
    if (scan.user_id !== userId) {
      return errorResponse("forbidden", "not your scan", 403);
    }

    if (scan.aging_image_url) {
      return jsonResponse({
        data: { aging_image_url: scan.aging_image_url, cached: true },
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

    const urls = await runPerfectCorpTaskAll({
      featureName: "aging",
      bytes,
      contentType,
      fileName,
    });
    // The series runs youth → old; the last frame is the oldest look.
    const resultUrl = urls[urls.length - 1];

    const imgRes = await fetch(resultUrl);
    if (!imgRes.ok) {
      throw new Error(`fetch aging ${imgRes.status}: ${imgRes.statusText}`);
    }
    const imgBlob = await imgRes.blob();
    const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());

    const agingPath = `${userId}/aging/${scanId}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("selfies")
      .upload(agingPath, imgBytes, {
        contentType: imgBlob.type || "image/jpeg",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { error: updErr } = await supabase
      .from("scans")
      .update({ aging_image_url: agingPath })
      .eq("id", scanId);
    if (updErr) throw updErr;

    return jsonResponse({
      data: { aging_image_url: agingPath, cached: false },
    });
  } catch (err) {
    console.error("simulate-aging error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
