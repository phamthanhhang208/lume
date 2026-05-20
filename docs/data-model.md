# Data Model

## Supabase tables

All tables have Row Level Security enabled. Default policy: a user can only read and write their own rows.

### profiles

Extends `auth.users` with app-specific data.

| Column           | Type        | Notes                                                                                                               |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| id               | uuid (PK)   | References `auth.users.id`                                                                                          |
| display_name     | text        | Nullable                                                                                                            |
| saved_selfie_url | text        | Nullable. URL into Supabase Storage. Used for VTO and as reusable Skin Analysis input                               |
| skin_tone_data   | jsonb       | Nullable. Result of Perfect Corp Skin Tone Analysis (skin tone class, eye color, lip color, brow color, hair color) |
| face_data        | jsonb       | Nullable. Result of Perfect Corp AI Face Analyzer (face shape, landmarks summary)                                   |
| created_at       | timestamptz | default now()                                                                                                       |
| updated_at       | timestamptz | default now()                                                                                                       |

### products

A user's logged makeup or skincare product.

| Column             | Type        | Notes                                                              |
| ------------------ | ----------- | ------------------------------------------------------------------ |
| id                 | uuid (PK)   | default gen_random_uuid()                                          |
| user_id            | uuid (FK)   | References `auth.users.id`                                         |
| name               | text        | e.g. "CeraVe Moisturizing Cream"                                   |
| brand              | text        | Nullable                                                           |
| category           | text        | Enum-like: "makeup" or "skincare"                                  |
| subcategory        | text        | Nullable. e.g. "lipstick", "moisturizer", "serum"                  |
| sticker_image_url  | text        | URL into Supabase Storage. Background-removed cutout               |
| original_image_url | text        | URL into Supabase Storage. The raw photo before background removal |
| ingredients        | text[]      | Array of ingredient strings, OCR'd from back of product            |
| notes              | text        | Nullable. User's own notes                                         |
| created_at         | timestamptz | default now()                                                      |

Indexes: `(user_id, created_at desc)` for the collection grid.

### scans

A user's skin analysis result at a point in time.

| Column        | Type        | Notes                                                 |
| ------------- | ----------- | ----------------------------------------------------- |
| id            | uuid (PK)   | default gen_random_uuid()                             |
| user_id       | uuid (FK)   | References `auth.users.id`                            |
| image_url     | text        | URL into Supabase Storage. The selfie analyzed        |
| metrics       | jsonb       | Object with 14 skin metrics, each a numeric score     |
| skin_age      | int         | Result of Perfect Corp Skin Analysis                  |
| overall_score | int         | Aggregate score from API                              |
| raw_response  | jsonb       | Full API response, kept for debugging and re-analysis |
| created_at    | timestamptz | default now()                                         |

The `metrics` JSON structure (locked in once we verify against Perfect Corp's response):

```ts
{
  wrinkle: number,
  pore: number,
  acne: number,
  redness: number,
  oiliness: number,
  moisture: number,
  dark_circle: number,
  eye_bag: number,
  firmness: number,
  radiance: number,
  age_spot: number,
  texture: number,
  droopy_eyelid: number,
  // exact list confirmed against Perfect Corp Skin Analysis V2.1 docs
}
```

Indexes: `(user_id, created_at desc)` for "latest scan" lookups.

### verdicts

Per-product verdict from Gemini, anchored to a specific scan.

| Column     | Type        | Notes                                                     |
| ---------- | ----------- | --------------------------------------------------------- |
| id         | uuid (PK)   | default gen_random_uuid()                                 |
| user_id    | uuid (FK)   | References `auth.users.id`                                |
| scan_id    | uuid (FK)   | References `scans.id`. The scan this verdict was based on |
| product_id | uuid (FK)   | References `products.id`                                  |
| verdict    | text        | Enum-like: "works", "neutral", "skip"                     |
| reasoning  | text        | Gemini's explanation, 1-3 sentences                       |
| created_at | timestamptz | default now()                                             |

Unique constraint on `(scan_id, product_id)` — one verdict per product per scan run.

Indexes: `(user_id, product_id)` for product detail view, `(scan_id)` for verdict grid view.

### looks

A generated makeup look.

| Column           | Type        | Notes                                                                 |
| ---------------- | ----------- | --------------------------------------------------------------------- |
| id               | uuid (PK)   | default gen_random_uuid()                                             |
| user_id          | uuid (FK)   | References `auth.users.id`                                            |
| prompt           | text        | The user's input, e.g. "clean girl makeup"                            |
| result_image_url | text        | URL into Supabase Storage. VTO output                                 |
| products_used    | jsonb       | Array of `{product_id, slot}` where slot is "foundation"/"blush"/etc. |
| gemini_reasoning | text        | Nullable. Why Gemini picked these products                            |
| created_at       | timestamptz | default now()                                                         |

Indexes: `(user_id, created_at desc)`.

## Storage buckets

All buckets have RLS-style policies: users can only access files under a path matching their user ID.

| Bucket     | Path pattern                                   | Use                                                        |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `selfies`  | `{user_id}/{timestamp}.jpg`                    | Skin Analysis input, VTO base. Public-read via signed URLs |
| `products` | `{user_id}/products/{product_id}/sticker.png`  | Background-removed product cutout                          |
| `products` | `{user_id}/products/{product_id}/original.jpg` | Original product photo                                     |
| `products` | `{user_id}/products/{product_id}/back.jpg`     | Product back, for ingredient OCR. Can be deleted after OCR |
| `looks`    | `{user_id}/{look_id}.jpg`                      | VTO output                                                 |

All bucket access uses signed URLs with reasonable expiry (e.g. 1 hour).

## TypeScript types

Define a single source of truth in `src/types/database.ts`. Generate or hand-write types that match the schema exactly. When the schema changes, the types change in the same commit.

Example shape:

```ts
export type ProductCategory = "makeup" | "skincare";
export type VerdictKind = "works" | "neutral" | "skip";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  subcategory: string | null;
  sticker_image_url: string;
  original_image_url: string;
  ingredients: string[];
  notes: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  image_url: string;
  metrics: SkinMetrics;
  skin_age: number;
  overall_score: number;
  raw_response: unknown;
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
```

## Migrations

Migrations live in `/supabase/migrations/` with timestamp prefixes: `20260517_000_initial_schema.sql`, `20260517_001_storage_policies.sql`, etc. Run via Supabase CLI.

Each migration is idempotent where possible and has a clear single purpose. No "fix things up" migrations that touch unrelated tables.
