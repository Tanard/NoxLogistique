-- Migration 006 : Carte technique du festival
-- Tables : festival_maps (1 par festival), map_markers (marqueurs), map_paths (tracés polylignes)

create table public.festival_maps (
  id          uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals(id) on delete cascade,
  center_lat  double precision not null default 46.603354,
  center_lng  double precision not null default 1.888334,
  zoom        integer not null default 13,
  locked      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (festival_id)
);

create table public.map_markers (
  id              uuid primary key default gen_random_uuid(),
  festival_map_id uuid not null references public.festival_maps(id) on delete cascade,
  type            text not null,
  lat             double precision not null,
  lng             double precision not null,
  label           text,
  created_at      timestamptz not null default now()
);

create table public.map_paths (
  id              uuid primary key default gen_random_uuid(),
  festival_map_id uuid not null references public.festival_maps(id) on delete cascade,
  type            text not null,
  points          jsonb not null default '[]',
  color           text not null,
  label           text,
  created_at      timestamptz not null default now()
);

-- RLS
alter table public.festival_maps enable row level security;
alter table public.map_markers   enable row level security;
alter table public.map_paths     enable row level security;

-- festival_maps : lecture pour tout membre, écriture pour admin + pole_manager
create policy "festival_maps_select" on public.festival_maps for select
  using (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = festival_maps.festival_id
      and festival_members.user_id = auth.uid()
  ));

create policy "festival_maps_insert" on public.festival_maps for insert
  with check (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = festival_maps.festival_id
      and festival_members.user_id = auth.uid()
      and festival_members.role in ('admin', 'pole_manager')
  ));

create policy "festival_maps_update" on public.festival_maps for update
  using (exists (
    select 1 from public.festival_members
    where festival_members.festival_id = festival_maps.festival_id
      and festival_members.user_id = auth.uid()
      and festival_members.role in ('admin', 'pole_manager')
  ));

-- map_markers : RLS via jointure festival_maps → festival_members
create policy "map_markers_select" on public.map_markers for select
  using (exists (
    select 1 from public.festival_maps fm
    join public.festival_members mem on mem.festival_id = fm.festival_id
    where fm.id = map_markers.festival_map_id
      and mem.user_id = auth.uid()
  ));

create policy "map_markers_insert" on public.map_markers for insert
  with check (exists (
    select 1 from public.festival_maps fm
    join public.festival_members mem on mem.festival_id = fm.festival_id
    where fm.id = map_markers.festival_map_id
      and mem.user_id = auth.uid()
      and mem.role in ('admin', 'pole_manager')
  ));

create policy "map_markers_delete" on public.map_markers for delete
  using (exists (
    select 1 from public.festival_maps fm
    join public.festival_members mem on mem.festival_id = fm.festival_id
    where fm.id = map_markers.festival_map_id
      and mem.user_id = auth.uid()
      and mem.role in ('admin', 'pole_manager')
  ));

-- map_paths : même logique
create policy "map_paths_select" on public.map_paths for select
  using (exists (
    select 1 from public.festival_maps fm
    join public.festival_members mem on mem.festival_id = fm.festival_id
    where fm.id = map_paths.festival_map_id
      and mem.user_id = auth.uid()
  ));

create policy "map_paths_insert" on public.map_paths for insert
  with check (exists (
    select 1 from public.festival_maps fm
    join public.festival_members mem on mem.festival_id = fm.festival_id
    where fm.id = map_paths.festival_map_id
      and mem.user_id = auth.uid()
      and mem.role in ('admin', 'pole_manager')
  ));

create policy "map_paths_delete" on public.map_paths for delete
  using (exists (
    select 1 from public.festival_maps fm
    join public.festival_members mem on mem.festival_id = fm.festival_id
    where fm.id = map_paths.festival_map_id
      and mem.user_id = auth.uid()
      and mem.role in ('admin', 'pole_manager')
  ));
