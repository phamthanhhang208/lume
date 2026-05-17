export const productKeys = {
  all: ["products"] as const,
  list: () => ["products", "list"] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};
