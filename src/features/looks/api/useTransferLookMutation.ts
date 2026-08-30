import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { lookKeys } from "@/features/looks/api/lookKeys";
import { uploadLookReference } from "@/features/looks/api/lookStorage";
import type { GeneratedLook } from "@/features/looks/api/useGenerateLookMutation";

export interface TransferLookInput {
  userId: string;
  /** Reference photo of the look to steal. */
  blob: Blob;
  title?: string;
}

interface TransferLookResponse {
  data?: { look: GeneratedLook };
  error?: { code: string; message: string };
}

export function useTransferLookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferLookInput): Promise<GeneratedLook> => {
      const storagePath = await uploadLookReference({
        userId: input.userId,
        blob: input.blob,
      });
      const { data, error } =
        await supabase.functions.invoke<TransferLookResponse>("transfer-look", {
          body: {
            storage_path: storagePath,
            ...(input.title ? { page_title: input.title } : {}),
          },
        });
      if (error) throw error;
      if (data?.error)
        throw new Error(`${data.error.code}: ${data.error.message}`);
      if (!data?.data?.look) throw new Error("no look in response");
      return data.data.look;
    },
    onSuccess: (look) => {
      queryClient.invalidateQueries({ queryKey: lookKeys.all });
      pendo.track("look_transferred", {
        products_matched: look.products_used.length,
        gaps_count: look.gaps?.length ?? 0,
        transfer_succeeded: !!look.result_image_url,
      });
    },
  });
}
