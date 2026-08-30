-- Reference image for "steal this look": the photo whose makeup was
-- transferred onto the user's selfie. Path under the `looks` bucket:
-- {user_id}/references/{look_id}.jpg. Null for prompt-generated looks.
alter table public.looks
  add column reference_image_url text;
