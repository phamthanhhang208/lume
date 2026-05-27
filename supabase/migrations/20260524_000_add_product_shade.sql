-- Add shade column to products.
-- Holds the color / shade name (e.g. "Rose Petal", "Medium 23") for makeup.
-- Nullable: skincare and unread Gemini extractions both leave it empty.

alter table public.products add column shade text;
