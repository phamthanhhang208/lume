import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { uploadProductImage } from "@/features/products/api/storage";

export interface ProcessBackInput {
  userId: string;
  productId: string;
  blob: Blob;
}

export interface ProcessBackResult {
  backStoragePath: string;
  ingredients: string[];
  /** True when OCR errored. Ingredients will be [] in that case. */
  ocrFellBack: boolean;
}

interface ExtractIngredientsResponse {
  data?: { ingredients: string[] };
  error?: { code: string; message: string };
}

export function useProcessBackPhotoMutation() {
  return useMutation({
    mutationFn: async (input: ProcessBackInput): Promise<ProcessBackResult> => {
      const back = await uploadProductImage({
        userId: input.userId,
        productId: input.productId,
        filename: "back.jpg",
        blob: input.blob,
      });

      try {
        const { data, error } = await supabase.functions.invoke<ExtractIngredientsResponse>(
          "extract-ingredients",
          { body: { storage_path: back.storagePath } },
        );
        if (error) throw error;
        if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
        const ingredients = data?.data?.ingredients ?? [];
        console.log("[process-back-photo]", {
          ingredientsFound: ingredients.length,
          ingredients,
        });
        return {
          backStoragePath: back.storagePath,
          ingredients,
          ocrFellBack: false,
        };
      } catch (err) {
        console.warn("ingredient OCR failed, user will type in:", err);
        return {
          backStoragePath: back.storagePath,
          ingredients: [],
          ocrFellBack: true,
        };
      }
    },
  });
}
