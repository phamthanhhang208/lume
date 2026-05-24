export type ProductCategory = "makeup" | "skincare";
export type VerdictKind = "works" | "neutral" | "skip";

export interface Profile {
  id: string;
  display_name: string | null;
  saved_selfie_url: string | null;
  skin_tone_data: unknown;
  face_data: unknown;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  subcategory: string | null;
  shade: string | null;
  sticker_image_url: string;
  original_image_url: string;
  ingredients: string[];
  notes: string | null;
  created_at: string;
}

export interface SkinMetrics {
  wrinkle: number;
  pore: number;
  acne: number;
  redness: number;
  oiliness: number;
  moisture: number;
  dark_circle: number;
  eye_bag: number;
  firmness: number;
  radiance: number;
  age_spot: number;
  texture: number;
  droopy_eyelid: number;
}

export interface Scan {
  id: string;
  user_id: string;
  image_url: string;
  metrics: SkinMetrics;
  skin_age: number;
  overall_score: number;
  raw_response: unknown;
  simulation_image_url: string | null;
  created_at: string;
}

export interface Verdict {
  id: string;
  user_id: string;
  scan_id: string;
  product_id: string;
  verdict: VerdictKind;
  reasoning: string;
  created_at: string;
}

export interface Look {
  id: string;
  user_id: string;
  prompt: string;
  result_image_url: string | null;
  products_used: Array<{ product_id: string; slot: string }>;
  gemini_reasoning: string | null;
  created_at: string;
}
