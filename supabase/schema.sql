create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check(role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Watchlist',
  created_at timestamptz not null default now()
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique(watchlist_id,symbol)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  alert_type text not null,
  target_price numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  nivora_score numeric,
  regime text,
  signal_state text,
  current_price numeric,
  analysis jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_timeframe text not null default '1D',
  email_alerts boolean not null default true,
  push_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name,role)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'user')
  on conflict(id) do nothing;
  insert into public.watchlists(user_id,name) values(new.id,'My Watchlist');
  insert into public.user_preferences(user_id) values(new.id) on conflict(user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.alerts enable row level security;
alter table public.analysis_history enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profile_select_own on public.profiles;
create policy profile_select_own on public.profiles for select using(auth.uid()=id);
drop policy if exists profile_update_own on public.profiles;
create policy profile_update_own on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
drop policy if exists watchlists_own on public.watchlists;
create policy watchlists_own on public.watchlists for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists watchlist_items_own on public.watchlist_items;
create policy watchlist_items_own on public.watchlist_items for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists alerts_own on public.alerts;
create policy alerts_own on public.alerts for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists analysis_own on public.analysis_history;
create policy analysis_own on public.analysis_history for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists preferences_own on public.user_preferences;
create policy preferences_own on public.user_preferences for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
