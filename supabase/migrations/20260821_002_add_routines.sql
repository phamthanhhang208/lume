-- Named routines: a user-curated subset of their products.
-- One routine per user may be active; generate-verdict grades the active
-- routine's products and falls back to the whole shelf when none is active
-- or the active routine is empty.

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index routines_user_created_idx
  on public.routines (user_id, created_at desc);
create unique index routines_one_active_per_user
  on public.routines (user_id) where is_active;

create table public.routine_products (
  routine_id uuid not null references public.routines(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (routine_id, product_id)
);

alter table public.routines enable row level security;
alter table public.routine_products enable row level security;

create policy routines_select_own on public.routines
  for select using (auth.uid() = user_id);
create policy routines_insert_own on public.routines
  for insert with check (auth.uid() = user_id);
create policy routines_update_own on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy routines_delete_own on public.routines
  for delete using (auth.uid() = user_id);

-- routine_products has no user_id; ownership flows through the routine.
create policy routine_products_select_own on public.routine_products
  for select using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );
create policy routine_products_insert_own on public.routine_products
  for insert with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );
create policy routine_products_delete_own on public.routine_products
  for delete using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );
