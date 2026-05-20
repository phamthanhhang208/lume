import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

interface EdgeResponse {
  data?: { ingredients: string[] };
  error?: { code: string; message: string };
}

export function useExtractIngredientsMutation() {
  return useMutation({
    mutationFn: async (storagePath: string): Promise<string[]> => {
      const { data, error } = await supabase.functions.invoke<EdgeResponse>(
        "extract-ingredients",
        { body: { storage_path: storagePath } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
      return data?.data?.ingredients ?? [];
    },
  });
}
