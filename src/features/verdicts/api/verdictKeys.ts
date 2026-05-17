export const verdictKeys = {
  all: ["verdicts"] as const,
  forLatestScan: () => ["verdicts", "for-latest-scan"] as const,
  forProduct: (productId: string) =>
    ["verdicts", "latest-for-product", productId] as const,
};
