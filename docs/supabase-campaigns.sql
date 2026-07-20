-- D20 Travesias shared campaign storage for Supabase.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  dm text not null default '',
  system_id text not null default 'dnd5e2024',
  system_name text not null default 'D&D 5e 2024',
  description text not null default '',
  theme text not null default 'parchment',
  font text not null default 'classic',
  appearance text not null default 'light',
  layout text not null default 'balanced',
  color text not null default '#9b4e35',
  banner text not null default '',
  password_hash text not null default '',
  recovery_hash text not null default '',
  access_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaigns
  add column if not exists recovery_hash text not null default '',
  add column if not exists access_version integer not null default 1,
  add column if not exists layout text not null default 'balanced';

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  player text not null default '',
  class_name text not null default '',
  xp numeric not null default 0,
  color text not null default '#b97a45',
  portrait text not null default '',
  notes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_workspaces (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.characters
  add column if not exists portrait text not null default '',
  add column if not exists notes jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  number integer not null default 1,
  date date not null,
  name text not null check (length(name) between 1 and 100),
  pools jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  historical boolean not null default false,
  allocations jsonb not null default '[]'::jsonb,
  total_awarded numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists characters_campaign_id_idx on public.characters(campaign_id);
create index if not exists sessions_campaign_id_idx on public.sessions(campaign_id);
create index if not exists sessions_campaign_date_idx on public.sessions(campaign_id, date desc);

drop view if exists public.campaign_summaries;

create view public.campaign_summaries
with (security_invoker = true) as
select
  c.id,
  c.name,
  c.dm,
  c.system_id,
  c.system_name,
  c.description,
  c.theme,
  c.font,
  c.appearance,
  c.layout,
  c.color,
  c.banner,
  c.created_at,
  c.updated_at,
  c.access_version,
  c.password_hash <> '' as protected,
  c.recovery_hash <> '' as recovery_configured,
  coalesce(character_counts.total, 0)::integer as character_count,
  coalesce(session_counts.total, 0)::integer as session_count,
  coalesce(session_counts.latest_number, 0)::integer as latest_session_number,
  coalesce(session_counts.total_awarded, 0)::numeric as total_awarded
from public.campaigns c
left join (
  select campaign_id, count(*) as total
  from public.characters
  group by campaign_id
) character_counts on character_counts.campaign_id = c.id
left join (
  select campaign_id, count(*) as total, max(number) as latest_number, sum(total_awarded) as total_awarded
  from public.sessions
  group by campaign_id
) session_counts on session_counts.campaign_id = c.id;

alter table public.campaigns enable row level security;
alter table public.characters enable row level security;
alter table public.sessions enable row level security;
alter table public.campaign_workspaces enable row level security;

revoke all on table public.campaigns from anon, authenticated;
revoke all on table public.characters from anon, authenticated;
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.campaign_workspaces from anon, authenticated;
revoke all on table public.campaign_summaries from anon, authenticated;

grant select, insert, update, delete on table public.campaigns to service_role;
grant select, insert, update, delete on table public.characters to service_role;
grant select, insert, update, delete on table public.sessions to service_role;
grant select, insert, update, delete on table public.campaign_workspaces to service_role;
grant select on table public.campaign_summaries to service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

-- This project uses Vercel API routes with the Supabase service role key.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in browser code.
