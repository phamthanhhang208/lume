import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { scanKeys } from "@/features/scans/api/scanKeys";

export interface SimulateSkinInput {
  scanId: string;
  productIds?: string[];
}

export interface SimulateSkinResult {
  simulationImageUrl: string | null;
  concernsSimulated: string[];
  cached: boolean;
}

interface SimulateSkinResponse {
  data?: {
    simulation_image_url: string | null;
    concerns_simulated: string[];
    cached: boolean;
  };
  error?: { code: string; message: string };
}

export function useSimulateSkinMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: SimulateSkinInput,
    ): Promise<SimulateSkinResult> => {
      const body: { scan_id: string; product_ids?: string[] } = {
        scan_id: input.scanId,
      };
      if (input.productIds && input.productIds.length > 0) {
        body.product_ids = input.productIds;
      }
      const { data, error } = await supabase.functions.invoke<SimulateSkinResponse>(
        "simulate-skin",
        { body },
      );
      if (error) throw error;
      if (data?.error) {
        throw new Error(`${data.error.code}: ${data.error.message}`);
      }
      const result = data?.data;
      if (!result) throw new Error("no simulation result");
      return {
        simulationImageUrl: result.simulation_image_url,
        concernsSimulated: result.concerns_simulated,
        cached: result.cached,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scanKeys.all });
    },
  });
}
