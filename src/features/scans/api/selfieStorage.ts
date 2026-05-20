import { supabase } from "@/lib/supabase";

const BUCKET = "selfies";
const SIGNED_URL_TTL = 60 * 60;

export interface UploadedSelfie {
  storagePath: string;
  signedUrl: string;
}

export async function uploadSelfie(opts: {
  userId: string;
  blob: Blob;
}): Promise<UploadedSelfie> {
  const { userId, blob } = opts;
  const storagePath = `${userId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (signError || !signed) throw signError ?? new Error("no signed url");

  return { storagePath, signedUrl: signed.signedUrl };
}

export async function createSelfieSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data) throw error ?? new Error("no signed url");
  return data.signedUrl;
}
