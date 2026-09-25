-- Farm Expense Tracker — Supabase schema
-- Run this once in Supabase: Project > SQL Editor > New query > paste all > Run

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
-- Mirrors auth.users so we have an email/name we can query easily
-- (e.g. from the daily cron job) without touching the protected auth schema.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user can read own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user can update own row"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- FIELDS (a field / plot / crop the farmer is tracking) ----------
create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  crop_name text,
  area_acres numeric,
  start_date date not null default current_date,
  is_archived boolean not null default false,
  is_completed boolean not null default false,
  total_income numeric(12,2) not null default 0.00,
  created_at timestamptz not null default now()
);

alter table public.fields enable row level security;

create policy "fields: owner full access"
  on public.fields for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- EXPENSES ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in (
    'labour', 'fertilizer', 'machine', 'diesel', 'food', 'rent', 'other'
  )),
  custom_label text,
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses: owner full access"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- INCOMES / HARVEST RETURNS ----------
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  income_date date not null default current_date,
  source_notes text,
  created_at timestamptz not null default now()
);

alter table public.incomes enable row level security;

create policy "incomes: owner full access"
  on public.incomes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists expenses_field_id_idx on public.expenses(field_id);
create index if not exists expenses_user_date_idx on public.expenses(user_id, expense_date);
create index if not exists fields_user_id_idx on public.fields(user_id);
create index if not exists incomes_field_id_idx on public.incomes(field_id);
create index if not exists incomes_user_id_idx on public.incomes(user_id);
