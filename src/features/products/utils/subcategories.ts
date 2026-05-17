import type { ProductCategory } from "@/types/database";

// Makeup subcategories map to Perfect Corp VTO effects (see docs/api-integration.md).
// Keep this list aligned with the effect map; Phase 5 (Build a Look) relies on it.
export const MAKEUP_SUBCATEGORIES = [
  "foundation",
  "concealer",
  "blush",
  "bronzer",
  "contour",
  "highlighter",
  "lipstick",
  "lip liner",
  "eyeshadow",
  "eyeliner",
  "eyelash",
  "eyebrow",
] as const;

export const SKINCARE_SUBCATEGORIES = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "eye cream",
  "sunscreen",
  "mask",
  "exfoliant",
  "treatment",
] as const;

export function subcategoriesFor(category: ProductCategory): readonly string[] {
  return category === "makeup" ? MAKEUP_SUBCATEGORIES : SKINCARE_SUBCATEGORIES;
}
