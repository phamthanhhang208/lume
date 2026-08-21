import { supabase } from "@/lib/supabase";

const BUCKET = "looks";
const SIGNED_URL_TTL = 60 * 60;

export async function uploadLookReference(opts: {
  userId: string;
  blob: Blob;
}): Promise<string> {
  const storagePath = `${opts.userId}/references/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, opts.blob, {
      contentType: opts.blob.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw error;
  return storagePath;
}

export async function createLookSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data) throw error ?? new Error("no signed url");
  return data.signedUrl;
}

export async function createLookSignedUrls(
  storagePaths: string[],
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL);
  if (error || !data) throw error ?? new Error("no signed urls");
  return Object.fromEntries(
    data
      .filter(
        (entry): entry is typeof entry & { path: string; signedUrl: string } =>
          typeof entry.path === "string" && typeof entry.signedUrl === "string",
      )
      .map((entry) => [entry.path, entry.signedUrl]),
  );
}
