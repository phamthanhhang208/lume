import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { routineKeys } from "@/features/routines/api/routineKeys";
import type { Routine, RoutineWithProducts } from "@/types/database";

interface RoutineRow extends Routine {
  routine_products: Array<{ product_id: string }>;
}

export function useRoutines() {
  return useQuery({
    queryKey: routineKeys.list(),
    queryFn: async (): Promise<RoutineWithProducts[]> => {
      const { data, error } = await supabase
        .from("routines")
        .select("*, routine_products(product_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as RoutineRow[]).map(
        ({ routine_products, ...routine }) => ({
          ...routine,
          product_ids: routine_products.map((rp) => rp.product_id),
        }),
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}
