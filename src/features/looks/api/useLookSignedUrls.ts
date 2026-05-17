import { useQuery } from "@tanstack/react-query";

import { createLookSignedUrls } from "@/features/looks/api/lookStorage";
import { lookKeys } from "@/features/looks/api/lookKeys";
import type { Look } from "@/types/database";

export function useLookSignedUrls(looks: Look[] | undefined) {
  const paths = Array.from(
    new Set(
      (looks ?? [])
        .map((look) => look.result_image_url)
        .filter((path): path is string => !!path),
    ),
  );
  const key = [...lookKeys.all, "image-urls", ...paths.slice().sort()] as const;

  return useQuery({
    queryKey: key,
    queryFn: () => createLookSignedUrls(paths),
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}
