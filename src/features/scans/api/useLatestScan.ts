import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { scanKeys } from "@/features/scans/api/scanKeys";
import type { Scan } from "@/types/database";

export function useLatestScan() {
  return useQuery({
    queryKey: scanKeys.latest(),
    queryFn: async (): Promise<Scan | null> => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
