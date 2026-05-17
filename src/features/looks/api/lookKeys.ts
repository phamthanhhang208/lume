export const lookKeys = {
  all: ["looks"] as const,
  list: () => ["looks", "list"] as const,
  imageUrl: (storagePath: string) => ["looks", "image", storagePath] as const,
};
