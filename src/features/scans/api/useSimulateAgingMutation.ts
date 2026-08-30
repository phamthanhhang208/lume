import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { scanKeys } from "@/features/scans/api/scanKeys";

export interface SimulateAgingInput {
  scanId: string;
}

export interface SimulateAgingResult {
  agingImageUrl: string | null;
  cached: boolean;
}

interface SimulateAgingResponse {
  data?: {
    aging_image_url: string | null;
    cached: boolean;
  };
  error?: { code: string; message: string };
}

export function useSimulateAgingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: SimulateAgingInput,
    ): Promise<SimulateAgingResult> => {
      const { data, error } =
        await supabase.functions.invoke<SimulateAgingResponse>(
          "simulate-aging",
          { body: { scan_id: input.scanId } },
        );
      if (error) throw error;
      if (data?.error) {
        throw new Error(`${data.error.code}: ${data.error.message}`);
      }
      const result = data?.data;
      if (!result) throw new Error("no aging result");
      return {
        agingImageUrl: result.aging_image_url,
        cached: result.cached,
      };
    },
    onSuccess: (result, { scanId }) => {
      queryClient.invalidateQueries({ queryKey: scanKeys.all });
      pendo.track("skin_aging_simulated", {
        scan_id: scanId,
        cached: result.cached,
      });
    },
  });
}
