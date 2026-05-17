-- Storage buckets for Lume.
-- All buckets are private; clients use signed URLs to read.
-- RLS on storage.objects keys file access on the first path segment:
-- files must live under {auth.uid()}/... for the owner to access them.

insert into storage.buckets (id, name, public) values
  ('selfies', 'selfies', false),
  ('products', 'products', false),
  ('looks', 'looks', false)
on conflict (id) do nothing;

-- selfies bucket
create policy "selfies: read own"
  on storage.objects for select
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "selfies: insert own"
  on storage.objects for insert
  with check (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "selfies: update own"
  on storage.objects for update
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "selfies: delete own"
  on storage.objects for delete
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);

-- products bucket
create policy "products: read own"
  on storage.objects for select
  using (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "products: insert own"
  on storage.objects for insert
  with check (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "products: update own"
  on storage.objects for update
  using (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "products: delete own"
  on storage.objects for delete
  using (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);

-- looks bucket
create policy "looks: read own"
  on storage.objects for select
  using (bucket_id = 'looks' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "looks: insert own"
  on storage.objects for insert
  with check (bucket_id = 'looks' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "looks: update own"
  on storage.objects for update
  using (bucket_id = 'looks' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "looks: delete own"
  on storage.objects for delete
  using (bucket_id = 'looks' and (storage.foldername(name))[1] = auth.uid()::text);
