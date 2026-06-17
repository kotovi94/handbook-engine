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
  color text not null default '#9b4e35',
  banner text not null default '',
  password_hash text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  player text not null default '',
  class_name text not null default '',
  xp numeric not null default 0,
  color text not null default '#b97a45',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create or replace view public.campaign_summaries as
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
  c.color,
  c.banner,
  c.created_at,
  c.updated_at,
  c.password_hash <> '' as protected,
  coalesce(character_counts.total, 0)::integer as character_count,
  coalesce(session_counts.total, 0)::integer as session_count,
  coalesce(session_counts.total_awarded, 0)::numeric as total_awarded
from public.campaigns c
left join (
  select campaign_id, count(*) as total
  from public.characters
  group by campaign_id
) character_counts on character_counts.campaign_id = c.id
left join (
  select campaign_id, count(*) as total, sum(total_awarded) as total_awarded
  from public.sessions
  group by campaign_id
) session_counts on session_counts.campaign_id = c.id;

-- This project uses Vercel API routes with the Supabase service role key.
-- Keep Row Level Security enabled later if you add direct browser access.
