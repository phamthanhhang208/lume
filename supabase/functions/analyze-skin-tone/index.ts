// Edge Function: analyze-skin-tone
//
// Input  : { storage_path: string }  - path under the `selfies` bucket
// Output : { data: { tone, raw_response } }
// Errors : { error: { code, message } }
//
// Runs Perfect Corp Skin Tone Analysis. The result includes skin tone class
// and eye/lip/brow/hair colors. We return whatever JSON the task produces
// alongside a best-effort flattened "tone" object so the client can render
// without re-parsing.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { storagePathBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

interface ToneSummary {
  skin_tone: string | null;
  eye_color: string | null;
  lip_color: string | null;
  brow_color: string | null;
  hair_color: string | null;
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

function summarize(raw: unknown): ToneSummary {
  if (!raw || typeof raw !== "object") {
    return {
      skin_tone: null,
      eye_color: null,
      lip_color: null,
      brow_color: null,
      hair_color: null,
    };
  }
  const obj = raw as Record<string, unknown>;
  const result =
    (obj.result as Record<string, unknown> | undefined) ??
    (obj.tone as Record<string, unknown> | undefined) ??
    obj;
  return {
    skin_tone: pickString(result, "skin_tone", "skinTone", "tone"),
    eye_color: pickString(result, "eye_color", "eyeColor"),
    lip_color: pickString(result, "lip_color", "lipColor"),
    brow_color: pickString(result, "brow_color", "browColor", "eyebrow_color"),
    hair_color: pickString(result, "hair_color", "hairColor"),
  };
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
      featureName: "skin-tone-analysis",
      bytes,
      contentType,
      fileName,
    });

    const resultRes = await fetch(resultUrl);
    if (!resultRes.ok) {
      throw new Error(`fetch tone result ${resultRes.status}: ${resultRes.statusText}`);
    }
    const raw = (await resultRes.json()) as Record<string, unknown>;
    console.log("skin-tone-analysis raw:", JSON.stringify(raw).slice(0, 2000));

    return jsonResponse({ data: { tone: summarize(raw), raw_response: raw } });
  } catch (err) {
    console.error("analyze-skin-tone error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
