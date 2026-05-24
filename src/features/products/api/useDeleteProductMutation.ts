import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { productKeys } from "@/features/products/api/productKeys";

export interface DeleteProductInput {
  productId: string;
  userId: string;
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeleteProductInput): Promise<void> => {
      // Best-effort storage cleanup; never blocks the DB delete.
      try {
        const folder = `${input.userId}/products/${input.productId}`;
        const { data: files } = await supabase.storage
          .from("products")
          .list(folder);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${folder}/${f.name}`);
          await supabase.storage.from("products").remove(paths);
        }
      } catch (err) {
        console.warn("storage cleanup failed (non-blocking):", err);
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", input.productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
