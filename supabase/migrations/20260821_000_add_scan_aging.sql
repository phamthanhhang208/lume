-- Caches the Perfect Corp AI Aging result image for a scan.
-- Storage path under the `selfies` bucket: {user_id}/aging/{scan_id}.jpg
alter table public.scans
  add column aging_image_url text;
