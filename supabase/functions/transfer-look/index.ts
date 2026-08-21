// Edge Function: transfer-look ("steal this look")
//
// Input  : { image_url?: string, storage_path?: string, page_title?: string }
//          — exactly one of image_url (extension right-click) or
//          storage_path (web app upload under looks/{userId}/references/).
// Output : { data: { look: { ..., gaps } } }
// Errors : { error: { code, message } }
//
// Flow:
//   1. Resolve reference image bytes (server-side fetch or storage download)
//   2. Download the user's saved selfie
//   3. Perfect Corp Makeup Transfer (mu-transfer, src=selfie ref=reference)
//   4. Upload result + reference copy into the looks bucket
//   5. Gemini vision maps the reference look to owned makeup products + gaps
//   6. Insert looks row (reference_image_url set)
//
// Soft-fail: if the transfer fails we still save the look with the product
// mapping and result_image_url = null, mirroring generate-look.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { VALID_MAKEUP_SLOTS } from "../_shared/makeup.ts";
import { runPerfectCorpTask } from "../_shared/perfectcorp.ts";
import { stealLookPrompt, stealLookPromptStricter } from "../_shared/prompts.ts";
import { lookOrchestration, transferLookBody } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    let rawBody: unknown;
    try { rawBody = await req.json(); }
    catch { return errorResponse("invalid_json", "request body is not valid JSON", 400); }

    const parsed = transferLookBody.safeParse(rawBody);
    if (!parsed.success) return errorResponse("invalid_request", parsed.error.message, 400);
    const { image_url, storage_path, page_title } = parsed.data;

    // 1. Reference image bytes
    let refBytes: Uint8Array;
    let refMime: string;
    if (image_url) {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) {
        return errorResponse("image_fetch_failed", `${imgRes.status}: ${imgRes.statusText}`, 502);
      }
      const imgBlob = await imgRes.blob();
      refBytes = new Uint8Array(await imgBlob.arrayBuffer());
      refMime = imgBlob.type || "image/jpeg";
    } else {
      if (!storage_path!.startsWith(`${userId}/`)) {
        return errorResponse("forbidden", "cannot access this path", 403);
      }
      const { data: refBlob, error: refErr } = await supabase.storage
        .from("looks")
        .download(storage_path!);
      if (refErr || !refBlob) {
        return errorResponse("download_failed", refErr?.message ?? "no reference blob", 500);
      }
      refBytes = new Uint8Array(await refBlob.arrayBuffer());
      refMime = refBlob.type || "image/jpeg";
    }

    // 2. Saved selfie
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("saved_selfie_url")
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile?.saved_selfie_url) {
      return errorResponse("no_selfie", "save a selfie first by running skin analysis", 400);
    }
    const { data: selfie, error: dlErr } = await supabase.storage
      .from("selfies")
      .download(profile.saved_selfie_url);
    if (dlErr || !selfie) {
      return errorResponse("download_failed", dlErr?.message ?? "no selfie blob", 500);
    }
    const selfieBytes = new Uint8Array(await selfie.arrayBuffer());
    const selfieMime = selfie.type || "image/jpeg";
    const selfieName = profile.saved_selfie_url.split("/").pop() ?? "selfie.jpg";

    // 5 (early). Product mapping runs regardless of transfer outcome.
    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, name, brand, subcategory, shade")
      .eq("category", "makeup");
    if (productsErr) throw productsErr;

    const ownedIds = new Set((products ?? []).map((p: { id: string }) => p.id));
    let mapping = { products: [], reasoning: "", gaps: [] } as {
      products: Array<{ product_id: string; slot: string; color?: string | null }>;
      reasoning: string;
      gaps: string[];
    };
    try {
      const orchestration = await callGeminiJson({
        prompt: stealLookPrompt(products ?? [], VALID_MAKEUP_SLOTS),
        retryPrompt: stealLookPromptStricter(products ?? [], VALID_MAKEUP_SLOTS),
        image: { mimeType: refMime, bytes: refBytes },
        geminiSchema: {
          type: "OBJECT",
          properties: {
            products: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  product_id: { type: "STRING" },
                  slot: { type: "STRING" },
                  color: { type: "STRING", nullable: true },
                },
                required: ["product_id", "slot"],
              },
            },
            reasoning: { type: "STRING" },
            gaps: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["products", "reasoning", "gaps"],
        },
        validator: lookOrchestration,
      });
      const usedSlots = new Set<string>();
      mapping = {
        ...orchestration,
        products: orchestration.products.filter((pick) => {
          if (!ownedIds.has(pick.product_id)) return false;
          if (usedSlots.has(pick.slot)) return false;
          usedSlots.add(pick.slot);
          return true;
        }),
      };
    } catch (err) {
      console.warn("steal-look product mapping failed (continuing):", err);
    }

    // 3+4. Makeup transfer + uploads
    const lookId = crypto.randomUUID();
    let resultStoragePath: string | null = null;
    let referenceStoragePath: string | null = storage_path ?? null;
    try {
      const resultUrl = await runPerfectCorpTask({
        featureName: "mu-transfer",
        bytes: selfieBytes,
        contentType: selfieMime,
        fileName: selfieName,
        refFile: {
          bytes: refBytes,
          contentType: refMime,
          fileName: "reference.jpg",
        },
      });

      const imgRes = await fetch(resultUrl);
      if (!imgRes.ok) throw new Error(`fetch transfer ${imgRes.status}: ${imgRes.statusText}`);
      const imgBlob = await imgRes.blob();
      const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());

      const lookPath = `${userId}/${lookId}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("looks")
        .upload(lookPath, imgBytes, {
          contentType: imgBlob.type || "image/jpeg",
          upsert: true,
        });
      if (upErr) throw upErr;
      resultStoragePath = lookPath;
    } catch (err) {
      console.warn("makeup transfer failed; saving look without image:", err);
    }

    // Keep a copy of URL-sourced references so the look can render
    // side-by-side later without depending on the external host.
    if (!referenceStoragePath) {
      try {
        const refPath = `${userId}/references/${lookId}.jpg`;
        const { error: refUpErr } = await supabase.storage
          .from("looks")
          .upload(refPath, refBytes, { contentType: refMime, upsert: true });
        if (refUpErr) throw refUpErr;
        referenceStoragePath = refPath;
      } catch (err) {
        console.warn("reference copy upload failed (continuing):", err);
      }
    }

    // 6. Insert looks row
    const productsUsed = mapping.products.map((pick) => ({
      product_id: pick.product_id,
      slot: pick.slot,
    }));
    const { data: look, error: insertErr } = await supabase
      .from("looks")
      .insert({
        id: lookId,
        user_id: userId,
        prompt: `steal: ${page_title ?? "reference look"}`,
        result_image_url: resultStoragePath,
        reference_image_url: referenceStoragePath,
        products_used: productsUsed,
        gemini_reasoning: mapping.reasoning || null,
      })
      .select("*")
      .single();
    if (insertErr) throw insertErr;

    // Signed URLs so clients without a storage session (the extension) can
    // render immediately. The web app signs paths itself and ignores these.
    const signed: { result: string | null; reference: string | null } = {
      result: null,
      reference: null,
    };
    for (const [key, path] of [
      ["result", resultStoragePath],
      ["reference", referenceStoragePath],
    ] as const) {
      if (!path) continue;
      const { data: signedData } = await supabase.storage
        .from("looks")
        .createSignedUrl(path, 60 * 60);
      signed[key] = signedData?.signedUrl ?? null;
    }

    return jsonResponse({ data: { look: { ...look, gaps: mapping.gaps }, signed } });
  } catch (err) {
    console.error("transfer-look error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
