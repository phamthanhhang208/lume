-- Initial schema for Lume.
-- 5 tables: profiles (extends auth.users), products, scans, verdicts, looks.
-- Indexes follow docs/data-model.md.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  saved_selfie_url text,
  skin_tone_data jsonb,
  face_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  category text not null check (category in ('makeup', 'skincare')),
  subcategory text,
  sticker_image_url text not null,
  original_image_url text not null,
  ingredients text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create index products_user_created_idx
  on public.products (user_id, created_at desc);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  metrics jsonb not null,
  skin_age int not null,
  overall_score int not null,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index scans_user_created_idx
  on public.scans (user_id, created_at desc);

create table public.verdicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_id uuid not null references public.scans(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  verdict text not null check (verdict in ('works', 'neutral', 'skip')),
  reasoning text not null,
  created_at timestamptz not null default now(),
  unique (scan_id, product_id)
);

create index verdicts_user_product_idx
  on public.verdicts (user_id, product_id);
create index verdicts_scan_idx
  on public.verdicts (scan_id);

create table public.looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  result_image_url text,
  products_used jsonb not null,
  gemini_reasoning text,
  created_at timestamptz not null default now()
);

create index looks_user_created_idx
  on public.looks (user_id, created_at desc);
