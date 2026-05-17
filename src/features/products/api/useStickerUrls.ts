import { useQuery } from "@tanstack/react-query";

import { createSignedUrls } from "@/features/products/api/storage";
import { productKeys } from "@/features/products/api/productKeys";
import type { Product } from "@/types/database";

export function useStickerUrls(products: Product[] | undefined) {
  const paths = Array.from(
    new Set((products ?? []).map((product) => product.sticker_image_url)),
  );
  const key = [...productKeys.all, "sticker-urls", ...paths.slice().sort()] as const;

  return useQuery({
    queryKey: key,
    queryFn: () => createSignedUrls(paths),
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}
