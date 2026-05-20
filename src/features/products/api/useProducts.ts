import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { productKeys } from "@/features/products/api/productKeys";
import type { Product } from "@/types/database";

export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
