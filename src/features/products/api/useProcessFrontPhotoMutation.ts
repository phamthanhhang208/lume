import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { uploadProductImage } from "@/features/products/api/storage";
import type { ProductCategory } from "@/types/database";

export interface ProcessFrontInput {
  userId: string;
  productId: string;
  category: ProductCategory;
  blob: Blob;
}

export interface ProcessFrontResult {
  originalStoragePath: string;
  stickerStoragePath: string;
  /** True when background removal failed and the original was reused. */
  stickerFellBack: boolean;
  name: string | null;
  brand: string | null;
  subcategory: string | null;
  shade: string | null;
  /** True when front-info extraction errored. Fields will be null in that case. */
  extractFellBack: boolean;
}

interface RemoveBackgroundResponse {
  data?: { result_url: string };
  error?: { code: string; message: string };
}

interface ExtractFrontInfoResponse {
  data?: {
    name: string | null;
    brand: string | null;
    subcategory: string | null;
    shade: string | null;
  };
  error?: { code: string; message: string };
}

interface BgResult {
  stickerStoragePath: string;
  fellBack: boolean;
}

interface ExtractResult {
  name: string | null;
  brand: string | null;
  subcategory: string | null;
  shade: string | null;
  fellBack: boolean;
}

async function runBackgroundRemoval(
  originalStoragePath: string,
  userId: string,
  productId: string,
): Promise<BgResult> {
  try {
    const { data, error } = await supabase.functions.invoke<RemoveBackgroundResponse>(
      "remove-background",
      { body: { storage_path: originalStoragePath } },
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
      userId,
      productId,
      filename: "sticker.png",
      blob: stickerBlob,
    });

    return { stickerStoragePath: sticker.storagePath, fellBack: false };
  } catch (err) {
    console.warn("background removal failed, reusing original as sticker:", err);
    return { stickerStoragePath: originalStoragePath, fellBack: true };
  }
}

async function runFrontInfoExtract(
  storagePath: string,
  category: ProductCategory,
): Promise<ExtractResult> {
  try {
    const { data, error } = await supabase.functions.invoke<ExtractFrontInfoResponse>(
      "extract-front-info",
      { body: { storage_path: storagePath, category } },
    );
    if (error) throw error;
    if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
    const info = data?.data;
    if (!info) throw new Error("no info in response");
    return { ...info, fellBack: false };
  } catch (err) {
    console.warn("front-info extract failed, user will fill in:", err);
    return {
      name: null,
      brand: null,
      subcategory: null,
      shade: null,
      fellBack: true,
    };
  }
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

      const [bg, extracted] = await Promise.all([
        runBackgroundRemoval(original.storagePath, input.userId, input.productId),
        runFrontInfoExtract(original.storagePath, input.category),
      ]);

      const result: ProcessFrontResult = {
        originalStoragePath: original.storagePath,
        stickerStoragePath: bg.stickerStoragePath,
        stickerFellBack: bg.fellBack,
        name: extracted.name,
        brand: extracted.brand,
        subcategory: extracted.subcategory,
        shade: extracted.shade,
        extractFellBack: extracted.fellBack,
      };

      pendo.track("front_photo_processed", {
        category: input.category,
        sticker_fell_back: bg.fellBack,
        extract_fell_back: extracted.fellBack,
        extracted_name: extracted.name ?? "",
        extracted_brand: extracted.brand ?? "",
        extracted_subcategory: extracted.subcategory ?? "",
      });

      return result;
    },
  });
}
