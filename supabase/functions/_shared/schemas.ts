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

export const transferLookBody = z
  .object({
    image_url: z.string().url().optional(),
    storage_path: z.string().min(1).optional(),
    page_title: z.string().max(280).optional(),
  })
  .refine((body) => !!body.image_url !== !!body.storage_path, {
    message: "provide exactly one of image_url or storage_path",
  });
export type TransferLookBody = z.infer<typeof transferLookBody>;

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

export const checkShadeBody = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(120).nullable(),
  shade: z.string().min(1).max(120),
});
export type CheckShadeBody = z.infer<typeof checkShadeBody>;

export const shadeCheck = z.object({
  verdict: z.enum([
    "match",
    "too_warm",
    "too_cool",
    "too_light",
    "too_deep",
    "unknown",
  ]),
  note: z.string().nullable().optional().default(null),
});
export type ShadeCheck = z.infer<typeof shadeCheck>;

export const routineCoverage = z.object({
  covered: z.array(z.string()),
  reasoning: z.string(),
});
export type RoutineCoverage = z.infer<typeof routineCoverage>;

export const lookPick = z.object({
  product_id: z.string().uuid(),
  slot: z.string().min(1),
  // Hex color inferred from the product's name/shade, used to drive the
  // makeup-vto palette. Null when the model can't infer one.
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional()
    .default(null),
});
export type LookPick = z.infer<typeof lookPick>;
export const lookOrchestration = z.object({
  products: z.array(lookPick),
  reasoning: z.string(),
  gaps: z.array(z.string()),
});
export type LookOrchestration = z.infer<typeof lookOrchestration>;
