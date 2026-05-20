import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { lookKeys } from "@/features/looks/api/lookKeys";
import type { Look } from "@/types/database";

export function useLooks() {
  return useQuery({
    queryKey: lookKeys.list(),
    queryFn: async (): Promise<Look[]> => {
      const { data, error } = await supabase
        .from("looks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Look[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
