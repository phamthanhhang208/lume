import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { scanKeys } from "@/features/scans/api/scanKeys";

export interface SimulateSkinInput {
  scanId: string;
}

export interface SimulateSkinResult {
  simulationImageUrl: string | null;
  cached: boolean;
  /** True when the simulation was filtered by the scan's works-verdicts. */
  routineConditioned: boolean;
  concernsSimulated: string[];
  concernsUncovered: string[];
  coverageReasoning: string | null;
}

interface SimulateSkinResponse {
  data?: {
    simulation_image_url: string | null;
    cached: boolean;
    routine_conditioned: boolean;
    concerns_simulated: string[];
    concerns_uncovered: string[];
    coverage_reasoning: string | null;
  };
  error?: { code: string; message: string };
}

export function useSimulateSkinMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: SimulateSkinInput,
    ): Promise<SimulateSkinResult> => {
      const { data, error } = await supabase.functions.invoke<SimulateSkinResponse>(
        "simulate-skin",
        { body: { scan_id: input.scanId } },
      );
      if (error) throw error;
      if (data?.error) {
        throw new Error(`${data.error.code}: ${data.error.message}`);
      }
      const result = data?.data;
      if (!result) throw new Error("no simulation result");
      return {
        simulationImageUrl: result.simulation_image_url,
        cached: result.cached,
        routineConditioned: result.routine_conditioned,
        concernsSimulated: result.concerns_simulated,
        concernsUncovered: result.concerns_uncovered,
        coverageReasoning: result.coverage_reasoning,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scanKeys.all });
    },
  });
}
