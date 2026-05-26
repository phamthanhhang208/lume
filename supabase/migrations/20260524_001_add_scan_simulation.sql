-- Adds a column to cache the Perfect Corp Skin Simulation result image for
-- a scan. Storage path under the `selfies` bucket: {user_id}/simulations/{scan_id}.jpg
alter table public.scans
  add column simulation_image_url text;
