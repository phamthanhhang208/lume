import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

interface EdgeResponse {
  data?: { result_url: string };
  error?: { code: string; message: string };
}

export function useRemoveBackgroundMutation() {
  return useMutation({
    mutationFn: async (storagePath: string): Promise<string> => {
      const { data, error } = await supabase.functions.invoke<EdgeResponse>(
        "remove-background",
        { body: { storage_path: storagePath } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
      const url = data?.data?.result_url;
      if (!url) throw new Error("no result_url in response");
      return url;
    },
  });
}
