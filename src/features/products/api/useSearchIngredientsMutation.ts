import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type IngredientSource = "manual" | "ocr" | "openbeautyfacts" | "gemini";

export interface SearchIngredientsInput {
  name: string;
  brand: string | null;
}

export interface SearchIngredientsResult {
  ingredients: string[];
  source: IngredientSource;
  sourceUrl: string | null;
  matchName: string | null;
}

interface SearchIngredientsResponse {
  data?: {
    ingredients: string[];
    source: "openbeautyfacts" | "gemini";
    source_url: string | null;
    match_name: string | null;
  };
  error?: { code: string; message: string };
}

export function useSearchIngredientsMutation() {
  return useMutation({
    mutationFn: async (
      input: SearchIngredientsInput,
    ): Promise<SearchIngredientsResult> => {
      try {
        const { data, error } = await supabase.functions.invoke<SearchIngredientsResponse>(
          "search-ingredients",
          { body: { name: input.name, brand: input.brand } },
        );
        if (error) throw error;
        if (data?.error) {
          throw new Error(`${data.error.code}: ${data.error.message}`);
        }
        const result = data?.data;
        if (!result) throw new Error("no result");
        return {
          ingredients: result.ingredients,
          source: result.source,
          sourceUrl: result.source_url,
          matchName: result.match_name,
        };
      } catch (err) {
        console.warn("ingredient search failed, user can hand-type:", err);
        return {
          ingredients: [],
          source: "gemini",
          sourceUrl: null,
          matchName: null,
        };
      }
    },
  });
}
