import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { verdictKeys } from "@/features/verdicts/api/verdictKeys";
import type { Verdict } from "@/types/database";

interface GenerateVerdictResponse {
  data?: { scan_id: string; verdicts: Verdict[] };
  error?: { code: string; message: string };
}

export function useGenerateVerdictMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Verdict[]> => {
      const { data, error } = await supabase.functions.invoke<GenerateVerdictResponse>(
        "generate-verdict",
        { body: {} },
      );
      if (error) throw error;
      if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
      return data?.data?.verdicts ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verdictKeys.all });
    },
  });
}
