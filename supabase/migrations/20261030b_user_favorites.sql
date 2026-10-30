-- Favoritos por conta. Só a própria pessoa lê e altera os seus; quem não está logado não acessa a tabela.
create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  benefit_slug text not null check (char_length(benefit_slug) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, benefit_slug)
);
alter table public.user_favorites enable row level security;
revoke all on public.user_favorites from anon, authenticated;
grant select, insert, delete on public.user_favorites to authenticated;

drop policy if exists favorites_owner_select on public.user_favorites;
create policy favorites_owner_select on public.user_favorites
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists favorites_owner_insert on public.user_favorites;
create policy favorites_owner_insert on public.user_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists favorites_owner_delete on public.user_favorites;
create policy favorites_owner_delete on public.user_favorites
  for delete to authenticated using (user_id = (select auth.uid()));
