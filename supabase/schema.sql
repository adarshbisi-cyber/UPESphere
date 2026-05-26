-- GradeFlow Database Schema
-- Run this in your Supabase SQL editor

-- ===== PROFILES =====
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  university_id text default 'generic_10',
  current_semester int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ===== SEMESTERS =====
create table if not exists public.semesters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Semester',
  semester_number int not null,
  academic_year text,
  sgpa numeric(4,2) check (sgpa >= 0 and sgpa <= 10),
  total_credits int check (total_credits > 0),
  university_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.semesters enable row level security;

create policy "Users can manage own semesters"
  on public.semesters for all
  using (auth.uid() = user_id);

create index semesters_user_id_idx on public.semesters(user_id);


-- ===== GPA RECORDS =====
create table if not exists public.gpa_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  semester_id uuid references public.semesters(id) on delete cascade,
  subjects jsonb not null default '[]',
  scale text not null default '10' check (scale in ('10', '4', 'percentage')),
  sgpa numeric(4,2) not null,
  total_credits int not null,
  percentage_equivalent numeric(5,2),
  university_id text,
  label text,
  created_at timestamptz default now()
);

alter table public.gpa_records enable row level security;

create policy "Users can manage own GPA records"
  on public.gpa_records for all
  using (auth.uid() = user_id);

create index gpa_records_user_id_idx on public.gpa_records(user_id);


-- ===== ATTENDANCE RECORDS =====
create table if not exists public.attendance_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_name text not null,
  attended int not null check (attended >= 0),
  total int not null check (total > 0),
  required_percentage numeric(5,2) not null default 75,
  current_percentage numeric(5,2) generated always as ((attended::numeric / total::numeric) * 100) stored,
  semester_id uuid references public.semesters(id) on delete set null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.attendance_records enable row level security;

create policy "Users can manage own attendance"
  on public.attendance_records for all
  using (auth.uid() = user_id);

create index attendance_user_id_idx on public.attendance_records(user_id);


-- ===== TRIGGER: auto-create profile on signup =====
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ===== TRIGGER: updated_at auto-update =====
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger semesters_updated_at before update on public.semesters
  for each row execute procedure public.handle_updated_at();

create trigger attendance_updated_at before update on public.attendance_records
  for each row execute procedure public.handle_updated_at();


-- ===== SUBJECTS (per GPA record) =====
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  gpa_record_id uuid references public.gpa_records(id) on delete cascade,
  name text not null,
  credits int not null check (credits > 0),
  grade text not null,
  grade_points numeric(4,2) not null,
  semester_id uuid references public.semesters(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.subjects enable row level security;

create policy "Users can manage own subjects"
  on public.subjects for all
  using (auth.uid() = user_id);

create index subjects_user_id_idx on public.subjects(user_id);


-- ===== OCR UPLOADS =====
create table if not exists public.ocr_uploads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  storage_path text not null,
  original_name text,
  subjects_extracted jsonb default '[]',
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz default now()
);

alter table public.ocr_uploads enable row level security;

create policy "Users can manage own OCR uploads"
  on public.ocr_uploads for all
  using (auth.uid() = user_id);

create index ocr_uploads_user_id_idx on public.ocr_uploads(user_id);


-- ===== SAMPLE SEED DATA (optional) =====
-- Uncomment to insert demo data after creating a user

-- insert into public.semesters (user_id, name, semester_number, sgpa, total_credits, university_id)
-- values
--   ('<your-user-id>', 'Semester 1', 1, 8.20, 22, 'vtu'),
--   ('<your-user-id>', 'Semester 2', 2, 7.80, 24, 'vtu'),
--   ('<your-user-id>', 'Semester 3', 3, 8.50, 22, 'vtu'),
--   ('<your-user-id>', 'Semester 4', 4, 8.10, 24, 'vtu');
