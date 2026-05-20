import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { productKeys } from "@/features/products/api/productKeys";
import type { Product, ProductCategory } from "@/types/database";

export interface CreateProductInput {
  productId: string;
  userId: string;
  category: ProductCategory;
  subcategory: string | null;
  name: string;
  brand: string | null;
  originalStoragePath: string;
  stickerStoragePath: string;
  backStoragePath: string;
  ingredients: string[];
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput): Promise<Product> => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          id: input.productId,
          user_id: input.userId,
          name: input.name,
          brand: input.brand,
          category: input.category,
          subcategory: input.subcategory,
          original_image_url: input.originalStoragePath,
          sticker_image_url: input.stickerStoragePath,
          ingredients: input.ingredients,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}
