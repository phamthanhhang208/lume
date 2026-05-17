import { z } from "npm:zod@4";

// ---------- Edge Function request bodies ----------

export const storagePathBody = z.object({
  storage_path: z.string().min(1),
});
export type StoragePathBody = z.infer<typeof storagePathBody>;

// ---------- AI response shapes ----------

export const ingredientList = z.array(z.string());
export type IngredientList = z.infer<typeof ingredientList>;

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
