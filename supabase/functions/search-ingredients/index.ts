// Edge Function: search-ingredients
//
// Input  : { name: string, brand: string | null }
// Output : { data: { ingredients, source, source_url, match_name } }
// Errors : { error: { code, message } }
//
// Two-tier lookup for when OCR returns an empty list (back-of-box thrown
// away, OCR fell back, etc.) or when the user just wants to populate
// ingredients from name alone:
//   1. Open Beauty Facts (free, structured, no key)
//   2. Gemini grounded Google Search fallback
// Both tiers soft-fail to an empty list so the user can still hand-type.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { callGeminiGrounded } from "../_shared/gemini.ts";
import {
  ingredientSearchPrompt,
  ingredientSearchPromptStricter,
} from "../_shared/prompts.ts";
import {
  ingredientSearchResult,
  searchIngredientsBody,
} from "../_shared/schemas.ts";
import { requireUser } from "../_shared/supabase.ts";

interface OBFProduct {
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  url?: string;
  code?: string;
}

interface OBFResponse {
  products?: OBFProduct[];
}

interface OBFMatch {
  ingredients: string[];
  source_url: string;
  match_name: string;
}

async function tryOpenBeautyFacts(
  name: string,
  brand: string | null,
): Promise<OBFMatch | null> {
  const terms = brand ? `${name} ${brand}` : name;
  const url =
    `https://world.openbeautyfacts.org/api/v2/search?categories_tags=cosmetics&search_terms=${
      encodeURIComponent(terms)
    }&fields=product_name,brands,ingredients_text,url,code&page_size=5`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "lume/1.0 (hackathon@lume.app)" },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("OBF non-ok:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as OBFResponse;
    const candidates = (data.products ?? []).filter(
      (p) =>
        typeof p.ingredients_text === "string" &&
        p.ingredients_text.length >= 30,
    );
    if (candidates.length === 0) return null;
    const pick = candidates[0];
    const ingredients = pick
      .ingredients_text!.split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 120);
    if (ingredients.length === 0) return null;
    return {
      ingredients,
      source_url:
        pick.url ??
        (pick.code
          ? `https://world.openbeautyfacts.org/product/${pick.code}`
          : "https://world.openbeautyfacts.org"),
      match_name: pick.product_name ?? name,
    };
  } catch (err) {
    console.warn("OBF lookup failed:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("invalid_json", "request body is not valid JSON", 400);
    }
    const parsed = searchIngredientsBody.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse("invalid_request", parsed.error.message, 400);
    }
    const { name, brand } = parsed.data;

    const obf = await tryOpenBeautyFacts(name, brand);
    if (obf) {
      return jsonResponse({
        data: {
          ingredients: obf.ingredients,
          source: "openbeautyfacts" as const,
          source_url: obf.source_url,
          match_name: obf.match_name,
        },
      });
    }

    try {
      const gem = await callGeminiGrounded({
        prompt: ingredientSearchPrompt(name, brand),
        retryPrompt: ingredientSearchPromptStricter(name, brand),
        validator: ingredientSearchResult,
      });
      const cleaned = gem.value.ingredients
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 120);
      return jsonResponse({
        data: {
          ingredients: cleaned,
          source: "gemini" as const,
          source_url: gem.value.source_url ?? gem.fallbackSource,
          match_name: cleaned.length > 0 ? name : null,
        },
      });
    } catch (err) {
      console.warn("Gemini grounded search failed (soft-fail):", err);
      return jsonResponse({
        data: {
          ingredients: [],
          source: "gemini" as const,
          source_url: null,
          match_name: null,
        },
      });
    }
  } catch (err) {
    console.error("search-ingredients error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
