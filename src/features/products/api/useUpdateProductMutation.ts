import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { productKeys } from "@/features/products/api/productKeys";
import type { Product } from "@/types/database";

export interface UpdateProductInput {
  productId: string;
  name: string;
  brand: string | null;
  subcategory: string | null;
  shade: string | null;
  ingredients: string[];
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProductInput): Promise<Product> => {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: input.name,
          brand: input.brand,
          subcategory: input.subcategory,
          shade: input.shade,
          ingredients: input.ingredients,
        })
        .eq("id", input.productId)
        .select("*")
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}
