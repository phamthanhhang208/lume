import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { productKeys } from "@/features/products/api/productKeys";
import type { Product } from "@/types/database";

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: async (): Promise<Product> => {
      if (!id) throw new Error("product id required");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
