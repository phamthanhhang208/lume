import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { lookKeys } from "@/features/looks/api/lookKeys";
import type { Look } from "@/types/database";

export function useDeleteLookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (look: Look) => {
      // Delete storage file first (best-effort — don't block on failure).
      if (look.result_image_url) {
        await supabase.storage.from("looks").remove([look.result_image_url]).catch(() => {});
      }
      const { error } = await supabase.from("looks").delete().eq("id", look.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lookKeys.all });
    },
  });
}
