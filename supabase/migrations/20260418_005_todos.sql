-- Migration 005 : Todo list par festival
-- Option A (titre, assigné, statut) — extensible vers Option B (priorite, echeance)

create table public.todos (
  id          uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals(id) on delete cascade,
  titre       text not null,
  description text,
  assignee    text not null,
  statut      text not null default 'À faire',
  -- Option B (futur) : priorite text, echeance date
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.todos enable row level security;

-- Lecture : tout membre du festival
create policy "todos_select" on public.todos for select
  using (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = todos.festival_id
      and festival_members.user_id = auth.uid()
  ));

-- Création / modification : admin + pole_manager
create policy "todos_insert" on public.todos for insert
  with check (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = todos.festival_id
      and festival_members.user_id = auth.uid()
      and festival_members.role in ('admin', 'pole_manager')
  ));

create policy "todos_update" on public.todos for update
  using (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = todos.festival_id
      and festival_members.user_id = auth.uid()
      and festival_members.role in ('admin', 'pole_manager')
  ));

-- Suppression : admin uniquement
create policy "todos_delete" on public.todos for delete
  using (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = todos.festival_id
      and festival_members.user_id = auth.uid()
      and festival_members.role = 'admin'
  ));

-- Realtime
alter publication supabase_realtime add table public.todos;
