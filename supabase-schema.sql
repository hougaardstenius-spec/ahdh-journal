-- ADHD Journal Schema
-- Kør dette i Supabase → SQL Editor → New query

-- Daglige noter
create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  entry_date date not null,
  scores jsonb default '{}',
  habits jsonb default '{}',
  sleep numeric(4,1),
  flow text,
  hyper text,
  energy_src text,
  drain text,
  overstim text,
  helped text,
  tomorrow text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, entry_date)
);

-- Ugerefleksioner
create table if not exists weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  best text,
  drain text,
  best_moments text,
  challenges text,
  experiment text,
  patterns jsonb default '{}',
  exp_outcome text,
  overall_score integer check (overall_score between 1 and 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, week_start)
);

-- Row Level Security: kun egne data
alter table daily_entries enable row level security;
alter table weekly_reflections enable row level security;

create policy "Brugere ser kun egne daglige noter"
  on daily_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Brugere ser kun egne ugerefleksioner"
  on weekly_reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-opdater updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger daily_entries_updated_at
  before update on daily_entries
  for each row execute function update_updated_at();

create trigger weekly_reflections_updated_at
  before update on weekly_reflections
  for each row execute function update_updated_at();

-- Kæledyr
create table if not exists pets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  species text not null,
  name text not null,
  energy integer not null default 50 check (energy between 0 and 100),
  happiness integer not null default 70 check (happiness between 0 and 100),
  total_activities integer not null default 0 check (total_activities >= 0),
  last_happiness_check_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table pets enable row level security;

create policy "Brugere ser kun eget kæledyr"
  on pets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger pets_updated_at
  before update on pets
  for each row execute function update_updated_at();

-- Push-notifikationer
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "Brugere ser kun egne push-abonnementer"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger push_subscriptions_updated_at
  before update on push_subscriptions
  for each row execute function update_updated_at();
