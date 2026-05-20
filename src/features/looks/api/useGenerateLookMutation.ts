import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { lookKeys } from "@/features/looks/api/lookKeys";
import type { Look } from "@/types/database";

export interface GeneratedLook extends Look {
  gaps: string[];
}

interface GenerateLookResponse {
  data?: { look: GeneratedLook };
  error?: { code: string; message: string };
}

export function useGenerateLookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prompt: string): Promise<GeneratedLook> => {
      const { data, error } = await supabase.functions.invoke<GenerateLookResponse>(
        "generate-look",
        { body: { prompt } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
      if (!data?.data?.look) throw new Error("no look in response");
      return data.data.look;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lookKeys.all });
    },
  });
}
