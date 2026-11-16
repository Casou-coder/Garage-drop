-- GarageDrop : sauvegarde en ligne des parties.
-- À exécuter une fois dans Supabase > SQL Editor. Sans effet sur les autres tables du projet.
-- Peut être relancé sans risque.

create table if not exists public.gd_saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  name       text,
  cars       integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.gd_saves enable row level security;

-- Chaque joueur ne voit et ne modifie que sa propre partie
drop policy if exists "gd_saves_select_own" on public.gd_saves;
create policy "gd_saves_select_own" on public.gd_saves for select to authenticated using (auth.uid() = user_id);

drop policy if exists "gd_saves_insert_own" on public.gd_saves;
create policy "gd_saves_insert_own" on public.gd_saves for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "gd_saves_update_own" on public.gd_saves;
create policy "gd_saves_update_own" on public.gd_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gd_saves_delete_own" on public.gd_saves;
create policy "gd_saves_delete_own" on public.gd_saves for delete to authenticated using (auth.uid() = user_id);

revoke all on public.gd_saves from anon;
grant select, insert, update, delete on public.gd_saves to authenticated;
