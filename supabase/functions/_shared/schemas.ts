import { z } from "npm:zod@4";

// ---------- Edge Function request bodies ----------

export const storagePathBody = z.object({
  storage_path: z.string().min(1),
});
export type StoragePathBody = z.infer<typeof storagePathBody>;

// ---------- AI response shapes ----------

export const ingredientList = z.array(z.string());
export type IngredientList = z.infer<typeof ingredientList>;
