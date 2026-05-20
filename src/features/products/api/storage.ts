import { supabase } from "@/lib/supabase";

const BUCKET = "products";

export interface UploadedFile {
  storagePath: string;
  signedUrl: string;
}

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function uploadProductImage(opts: {
  userId: string;
  productId: string;
  filename: "original.jpg" | "sticker.png" | "back.jpg";
  blob: Blob;
}): Promise<UploadedFile> {
  const { userId, productId, filename, blob } = opts;
  const storagePath = `${userId}/products/${productId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType: blob.type || "application/octet-stream",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (signError || !signed) throw signError ?? new Error("no signed url");

  return { storagePath, signedUrl: signed.signedUrl };
}

export async function createSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data) throw error ?? new Error("no signed url");
  return data.signedUrl;
}
