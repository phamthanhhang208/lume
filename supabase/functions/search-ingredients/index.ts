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
import { callGeminiGrounded, callGeminiJson } from "../_shared/gemini.ts";
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

/** Try multiple delimiters to parse an OBF ingredients_text blob. */
function parseOBFIngredients(text: string): string[] {
  const strategies = [
    // Standard INCI: comma or semicolon separated
    () => text.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 0 && s.length < 200),
    // Newline separated (some OBF entries)
    () => text.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.length > 0 && s.length < 200),
    // Bullet / middle-dot / dash separated
    () => text.split(/[·•\-]/).map((s) => s.trim()).filter((s) => s.length > 0 && s.length < 200),
  ];
  for (const strategy of strategies) {
    const result = strategy();
    if (result.length > 1) return result;
  }
  // Last resort: treat the whole text as a single entry so we don't return empty
  const trimmed = text.trim();
  return trimmed.length > 0 ? [trimmed.slice(0, 300)] : [];
}

async function tryOpenBeautyFacts(
  name: string,
  brand: string | null,
): Promise<OBFMatch | null> {
  // openbeautyfacts.org is already cosmetics-only — no need for categories_tags
  // which filters out most products because they're tagged with specific tags
  // (en:lipsticks, en:foundations, …) not the generic "cosmetics".
  const terms = brand ? `${name} ${brand}` : name;
  const url =
    `https://world.openbeautyfacts.org/api/v2/search?search_terms=${
      encodeURIComponent(terms)
    }&fields=product_name,brands,ingredients_text,url,code&page_size=5`;

  console.log("[OBF] searching:", terms);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "lume/1.0 (hackathon@lume.app)" },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("[OBF] non-ok response:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as OBFResponse;
    console.log("[OBF] total products returned:", data.products?.length ?? 0);

    const candidates = (data.products ?? []).filter(
      (p) =>
        typeof p.ingredients_text === "string" &&
        p.ingredients_text.length >= 30,
    );
    console.log("[OBF] candidates with ingredients:", candidates.length);

    // Return null ONLY when there are zero candidates — once we have a candidate
    // we commit to it and never fall through to Gemini.
    if (candidates.length === 0) return null;

    const pick = candidates[0];
    const ingredients = parseOBFIngredients(pick.ingredients_text!);
    console.log("[OBF] matched:", pick.product_name, "ingredients:", ingredients.length);

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
    console.warn("[OBF] lookup failed:", err);
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

    // 1. Try Gemini first (grounded Google Search → structured-output fallback).
    let gemIngredients: string[] = [];
    let gemSourceUrl: string | null = null;

    try {
      console.log("[Gemini] trying grounded search…");
      const gem = await callGeminiGrounded({
        prompt: ingredientSearchPrompt(name, brand),
        retryPrompt: ingredientSearchPromptStricter(name, brand),
        validator: ingredientSearchResult,
      });
      gemIngredients = gem.value.ingredients
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0 && s.length < 200);
      gemSourceUrl = gem.value.source_url ?? gem.fallbackSource;
      console.log("[Gemini] grounded OK, ingredients:", gemIngredients.length, "sourceUrl:", gemSourceUrl);
    } catch (groundedErr) {
      console.warn("[Gemini] grounded search failed, trying structured-output fallback:", groundedErr);
      try {
        const geminiSchema = {
          type: "OBJECT" as const,
          properties: {
            ingredients: { type: "ARRAY" as const, items: { type: "STRING" as const } },
            source_url: { type: "STRING" as const, nullable: true },
          },
          required: ["ingredients", "source_url"],
        };
        const fallback = await callGeminiJson({
          prompt: ingredientSearchPrompt(name, brand),
          retryPrompt: ingredientSearchPromptStricter(name, brand),
          geminiSchema,
          validator: ingredientSearchResult,
        });
        gemIngredients = fallback.ingredients
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && s.length < 200);
        gemSourceUrl = fallback.source_url;
        console.log("[Gemini] structured fallback OK, ingredients:", gemIngredients.length);
      } catch (fallbackErr) {
        console.warn("[Gemini] structured fallback also failed:", fallbackErr);
      }
    }

    if (gemIngredients.length > 0) {
      return jsonResponse({
        data: {
          ingredients: gemIngredients,
          source: "gemini" as const,
          source_url: gemSourceUrl,
          match_name: name,
        },
      });
    }

    // 2. Gemini returned nothing — fall back to OBF.
    console.log("[OBF] Gemini empty, trying Open Beauty Facts…");
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

    // Both came back empty — soft-fail so the user can type manually.
    console.warn("[search-ingredients] both Gemini and OBF returned empty for:", name, brand);
    return jsonResponse({
      data: {
        ingredients: [],
        source: "gemini" as const,
        source_url: null,
        match_name: null,
      },
    });
  } catch (err) {
    console.error("search-ingredients error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500);
  }
});
