-- ============================================================
-- PRISM PERFORMANCE SYSTEM — DATABASE SCHEMA
-- Run this in Supabase SQL Editor: supabase.com → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with role and practitioner link
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text not null default 'client' check (role in ('practitioner', 'client')),
  practitioner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── CLIENTS ───────────────────────────────────────────────────────────────────
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  practitioner_id uuid references public.profiles(id) not null,
  profile_id uuid references public.profiles(id),
  name text not null,
  email text,
  program text not null default 'REBUILD' check (program in ('REGULATE','REBUILD','LEAD')),
  training_age text not null default 'intermediate',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── INTAKE ASSESSMENTS ────────────────────────────────────────────────────────
create table public.intake_assessments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  goals text[] default '{}',
  client_description text,
  contraindications text,
  session_duration int default 60,
  posture_findings jsonb default '{}',
  movement_findings jsonb default '{}',
  prism_findings jsonb default '{}',
  free_text text,
  updated_at timestamptz default now()
);

-- ── CHEK SCORES ───────────────────────────────────────────────────────────────
create table public.chek_scores (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  answers jsonb default '{}',
  traffic_light text check (traffic_light in ('GREEN','AMBER','RED')),
  total_score int,
  max_score int,
  pct int,
  label text,
  description text,
  assessed_at timestamptz default now()
);

-- ── PROGRAMS ──────────────────────────────────────────────────────────────────
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  duration_weeks int not null,
  sessions_per_week int not null,
  target_minutes int default 60,
  phase_goal text,
  traffic_light text,
  rationale text,
  prism_layer_notes jsonb default '{}',
  progression_protocol text,
  last_adaptation jsonb,
  weeks jsonb not null default '[]',
  is_active boolean default true,
  generated_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── SESSIONS ──────────────────────────────────────────────────────────────────
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  program_id uuid references public.programs(id),
  pillar text not null default 'REBUILD',
  session_notes text,
  exercises jsonb not null default '[]',
  status text not null default 'active' check (status in ('active','complete')),
  week_index int default 0,
  date timestamptz default now()
);

-- ── PROGRESSION PLANS ─────────────────────────────────────────────────────────
create table public.progression_plans (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  session_id uuid references public.sessions(id),
  exercises jsonb not null default '[]',
  generated_at timestamptz default now()
);

-- ── CLIENT INVITES ────────────────────────────────────────────────────────────
create table public.client_invites (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  token text unique not null,
  email text not null,
  accepted boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.intake_assessments enable row level security;
alter table public.chek_scores enable row level security;
alter table public.programs enable row level security;
alter table public.sessions enable row level security;
alter table public.progression_plans enable row level security;
alter table public.client_invites enable row level security;

-- Profiles: users can read own profile
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Clients: practitioners own their clients; clients can read their own record
create policy "Practitioners manage own clients" on public.clients
  for all using (practitioner_id = auth.uid());

create policy "Clients read own record" on public.clients
  for select using (profile_id = auth.uid());

-- Intake: practitioner full access; client read own
create policy "Practitioner intake access" on public.intake_assessments
  for all using (
    exists (select 1 from public.clients c where c.id = client_id and c.practitioner_id = auth.uid())
  );
create policy "Client reads own intake" on public.intake_assessments
  for select using (
    exists (select 1 from public.clients c where c.id = client_id and c.profile_id = auth.uid())
  );

-- CHEK scores
create policy "Practitioner chek access" on public.chek_scores
  for all using (
    exists (select 1 from public.clients c where c.id = client_id and c.practitioner_id = auth.uid())
  );
create policy "Client reads own chek" on public.chek_scores
  for select using (
    exists (select 1 from public.clients c where c.id = client_id and c.profile_id = auth.uid())
  );

-- Programs
create policy "Practitioner program access" on public.programs
  for all using (
    exists (select 1 from public.clients c where c.id = client_id and c.practitioner_id = auth.uid())
  );
create policy "Client reads own program" on public.programs
  for select using (
    exists (select 1 from public.clients c where c.id = client_id and c.profile_id = auth.uid())
  );

-- Sessions
create policy "Practitioner session access" on public.sessions
  for all using (
    exists (select 1 from public.clients c where c.id = client_id and c.practitioner_id = auth.uid())
  );
create policy "Client manages own sessions" on public.sessions
  for all using (
    exists (select 1 from public.clients c where c.id = client_id and c.profile_id = auth.uid())
  );

-- Progression plans
create policy "Practitioner plan access" on public.progression_plans
  for all using (
    exists (select 1 from public.clients c where c.id = client_id and c.practitioner_id = auth.uid())
  );
create policy "Client reads own plan" on public.progression_plans
  for select using (
    exists (select 1 from public.clients c where c.id = client_id and c.profile_id = auth.uid())
  );

-- ── REALTIME ──────────────────────────────────────────────────────────────────
-- Enable realtime on key tables so changes sync instantly across devices
alter publication supabase_realtime add table public.programs;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.progression_plans;

-- ── UPDATED_AT TRIGGERS ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger set_clients_updated_at before update on public.clients
  for each row execute procedure public.set_updated_at();
create trigger set_programs_updated_at before update on public.programs
  for each row execute procedure public.set_updated_at();
create trigger set_intake_updated_at before update on public.intake_assessments
  for each row execute procedure public.set_updated_at();
