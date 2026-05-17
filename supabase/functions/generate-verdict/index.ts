// Edge Function: generate-verdict
//
// Input  : {} (empty body; user/scan/products derived server-side)
// Output : { data: { scan_id, verdicts: Verdict[] } }
// Errors : { error: { code, message } }
//
// Reads the caller's latest scan + all products, prompts Gemini with
// structured output, validates, and writes verdicts in a transaction:
// existing verdicts for (user_id, scan_id) are deleted first so re-running
// is idempotent.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiJson } from "../_shared/gemini.ts";
import { verdictPrompt, verdictPromptStricter } from "../_shared/prompts.ts";
import { verdictList } from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    const { data: scan, error: scanErr } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (scanErr) throw scanErr;
    if (!scan) return errorResponse("no_scan", "no skin scan found", 400);

    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, name, brand, category, subcategory, ingredients");
    if (productsErr) throw productsErr;
    if (!products || products.length === 0) {
      return errorResponse("no_products", "no products to analyze", 400);
    }

    const ownedIds = new Set(products.map((product) => product.id));
    const metrics = (scan.metrics ?? {}) as Record<string, number>;

    const raw = await callGeminiJson({
      prompt: verdictPrompt(metrics, products),
      retryPrompt: verdictPromptStricter(metrics, products),
      geminiSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            product_id: { type: "STRING" },
            verdict: { type: "STRING", enum: ["works", "neutral", "skip"] },
            reasoning: { type: "STRING" },
          },
          required: ["product_id", "verdict", "reasoning"],
        },
      },
      validator: verdictList,
    });

    const filtered = raw.filter((item) => ownedIds.has(item.product_id));
    if (filtered.length === 0) {
      return errorResponse("no_valid_verdicts", "model returned no valid product ids", 502);
    }

    const { error: delError } = await supabase
      .from("verdicts")
      .delete()
      .eq("user_id", userId)
      .eq("scan_id", scan.id);
    if (delError) throw delError;

    const rows = filtered.map((item) => ({
      user_id: userId,
      scan_id: scan.id,
      product_id: item.product_id,
      verdict: item.verdict,
      reasoning: item.reasoning,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("verdicts")
      .insert(rows)
      .select("*");
    if (insertError) throw insertError;

    return jsonResponse({ data: { scan_id: scan.id, verdicts: inserted ?? [] } });
  } catch (err) {
    console.error("generate-verdict error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
