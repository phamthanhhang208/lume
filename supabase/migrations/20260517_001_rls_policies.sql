-- Row Level Security for Lume.
-- Default: a user can only read/write rows they own.
-- profiles is keyed on id = auth.uid(); other tables on user_id = auth.uid().

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.scans enable row level security;
alter table public.verdicts enable row level security;
alter table public.looks enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

-- products
create policy products_select_own on public.products
  for select using (auth.uid() = user_id);
create policy products_insert_own on public.products
  for insert with check (auth.uid() = user_id);
create policy products_update_own on public.products
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy products_delete_own on public.products
  for delete using (auth.uid() = user_id);

-- scans
create policy scans_select_own on public.scans
  for select using (auth.uid() = user_id);
create policy scans_insert_own on public.scans
  for insert with check (auth.uid() = user_id);
create policy scans_update_own on public.scans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy scans_delete_own on public.scans
  for delete using (auth.uid() = user_id);

-- verdicts
create policy verdicts_select_own on public.verdicts
  for select using (auth.uid() = user_id);
create policy verdicts_insert_own on public.verdicts
  for insert with check (auth.uid() = user_id);
create policy verdicts_update_own on public.verdicts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy verdicts_delete_own on public.verdicts
  for delete using (auth.uid() = user_id);

-- looks
create policy looks_select_own on public.looks
  for select using (auth.uid() = user_id);
create policy looks_insert_own on public.looks
  for insert with check (auth.uid() = user_id);
create policy looks_update_own on public.looks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy looks_delete_own on public.looks
  for delete using (auth.uid() = user_id);
