import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { verdictKeys } from "@/features/verdicts/api/verdictKeys";
import type { Verdict } from "@/types/database";

export interface LatestVerdicts {
  scanId: string | null;
  byProductId: Record<string, Verdict>;
}

export function useLatestVerdicts() {
  return useQuery({
    queryKey: verdictKeys.forLatestScan(),
    queryFn: async (): Promise<LatestVerdicts> => {
      const { data: scan, error: scanError } = await supabase
        .from("scans")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (scanError) throw scanError;
      if (!scan) return { scanId: null, byProductId: {} };

      const { data: verdicts, error: verdictsError } = await supabase
        .from("verdicts")
        .select("*")
        .eq("scan_id", scan.id);
      if (verdictsError) throw verdictsError;

      const byProductId: Record<string, Verdict> = {};
      for (const v of (verdicts ?? []) as Verdict[]) {
        byProductId[v.product_id] = v;
      }
      return { scanId: scan.id, byProductId };
    },
    staleTime: 1000 * 60 * 5,
  });
}
