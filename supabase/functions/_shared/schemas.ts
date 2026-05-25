import { z } from "npm:zod@4";

// ---------- Edge Function request bodies ----------

export const storagePathBody = z.object({
  storage_path: z.string().min(1),
});
export type StoragePathBody = z.infer<typeof storagePathBody>;

export const frontInfoBody = z.object({
  storage_path: z.string().min(1),
  category: z.enum(["makeup", "skincare"]),
});
export type FrontInfoBody = z.infer<typeof frontInfoBody>;

export const searchIngredientsBody = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(120).nullable(),
});
export type SearchIngredientsBody = z.infer<typeof searchIngredientsBody>;

export const simulateSkinBody = z.object({
  scan_id: z.string().uuid(),
  product_ids: z.array(z.string().uuid()).optional(),
});
export type SimulateSkinBody = z.infer<typeof simulateSkinBody>;

// ---------- AI response shapes ----------

export const ingredientList = z.array(z.string());
export type IngredientList = z.infer<typeof ingredientList>;

export const ingredientSearchResult = z.object({
  ingredients: z.array(z.string()),
  source_url: z.string().nullable(),
});
export type IngredientSearchResult = z.infer<typeof ingredientSearchResult>;

export const frontInfo = z.object({
  name: z.string().nullable(),
  brand: z.string().nullable(),
  subcategory: z.string().nullable(),
  shade: z.string().nullable(),
});
export type FrontInfo = z.infer<typeof frontInfo>;

export const verdictItem = z.object({
  product_id: z.string().uuid(),
  verdict: z.enum(["works", "neutral", "skip"]),
  reasoning: z.string().min(1),
});
export type VerdictItem = z.infer<typeof verdictItem>;
export const verdictList = z.array(verdictItem);

export const lookPick = z.object({
  product_id: z.string().uuid(),
  slot: z.string().min(1),
});
export type LookPick = z.infer<typeof lookPick>;
export const lookOrchestration = z.object({
  products: z.array(lookPick),
  reasoning: z.string(),
  gaps: z.array(z.string()),
});
export type LookOrchestration = z.infer<typeof lookOrchestration>;
