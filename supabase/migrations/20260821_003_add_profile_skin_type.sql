-- Fitzpatrick skin type from Perfect Corp AI-Fitzpatrick-Skin-Type-Analysis,
-- stored like skin_tone_data / face_data: summarized JSON, populated
-- silently after the first scan.
alter table public.profiles
  add column skin_type_data jsonb;
