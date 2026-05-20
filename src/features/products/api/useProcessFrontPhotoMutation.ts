import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { uploadProductImage } from "@/features/products/api/storage";

export interface ProcessFrontInput {
  userId: string;
  productId: string;
  blob: Blob;
}

export interface ProcessFrontResult {
  originalStoragePath: string;
  stickerStoragePath: string;
  /** True when background removal failed and the original was reused. */
  stickerFellBack: boolean;
}

interface RemoveBackgroundResponse {
  data?: { result_url: string };
  error?: { code: string; message: string };
}

export function useProcessFrontPhotoMutation() {
  return useMutation({
    mutationFn: async (input: ProcessFrontInput): Promise<ProcessFrontResult> => {
      const original = await uploadProductImage({
        userId: input.userId,
        productId: input.productId,
        filename: "original.jpg",
        blob: input.blob,
      });

      try {
        const { data, error } = await supabase.functions.invoke<RemoveBackgroundResponse>(
          "remove-background",
          { body: { storage_path: original.storagePath } },
        );
        if (error) throw error;
        if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
        const url = data?.data?.result_url;
        if (!url) throw new Error("no result_url in response");

        const fetched = await fetch(url);
        if (!fetched.ok) {
          throw new Error(`fetch sticker ${fetched.status}: ${fetched.statusText}`);
        }
        const stickerBlob = await fetched.blob();

        const sticker = await uploadProductImage({
          userId: input.userId,
          productId: input.productId,
          filename: "sticker.png",
          blob: stickerBlob,
        });

        return {
          originalStoragePath: original.storagePath,
          stickerStoragePath: sticker.storagePath,
          stickerFellBack: false,
        };
      } catch (err) {
        console.warn("background removal failed, reusing original as sticker:", err);
        return {
          originalStoragePath: original.storagePath,
          stickerStoragePath: original.storagePath,
          stickerFellBack: true,
        };
      }
    },
  });
}
