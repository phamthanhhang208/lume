import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { scanKeys } from "@/features/scans/api/scanKeys";

const SIGNED_URL_TTL = 60 * 60;

export function useSelfieSignedUrls(paths: (string | null | undefined)[]) {
  const cleanPaths = Array.from(
    new Set(
      paths.filter(
        (p): p is string => typeof p === "string" && p.length > 0,
      ),
    ),
  );
  const key = [
    ...scanKeys.all,
    "signed-urls",
    ...cleanPaths.slice().sort(),
  ] as const;

  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<Record<string, string>> => {
      if (cleanPaths.length === 0) return {};
      const { data, error } = await supabase.storage
        .from("selfies")
        .createSignedUrls(cleanPaths, SIGNED_URL_TTL);
      if (error || !data) throw error ?? new Error("no signed urls");
      return Object.fromEntries(
        data
          .filter(
            (entry): entry is typeof entry & { path: string; signedUrl: string } =>
              typeof entry.path === "string" &&
              typeof entry.signedUrl === "string",
          )
          .map((entry) => [entry.path, entry.signedUrl]),
      );
    },
    enabled: cleanPaths.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}
