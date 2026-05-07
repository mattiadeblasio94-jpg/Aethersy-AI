-- Aethersy AI - Emergent Clone Database Schema
-- Tables: users, projects, tasks, builds

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text,
  status text default 'idle',
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  role text not null, -- 'user' | 'assistant' | 'system'
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  status text not null, -- 'pending' | 'running' | 'success' | 'failed'
  logs text,
  artifact_url text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_builds_project_id on public.builds(project_id);

-- RLS Policies (Row Level Security)
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.builds enable row level security;

-- Users can read their own data
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = owner_id);

create policy "Users can view own tasks" on public.tasks
  for select using (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

create policy "Users can view own builds" on public.builds
  for select using (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

-- Users can insert their own data
create policy "Users can create projects" on public.projects
  for insert with check (auth.uid() = owner_id);

create policy "Users can create tasks" on public.tasks
  for insert with check (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

create policy "Users can create builds" on public.builds
  for insert with check (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

-- Users can update their own data
create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = owner_id);

create policy "Users can update own tasks" on public.tasks
  for update using (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

create policy "Users can update own builds" on public.builds
  for update using (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

-- Users can delete their own data
create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = owner_id);

create policy "Users can delete own tasks" on public.tasks
  for delete using (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );

create policy "Users can delete own builds" on public.builds
  for delete using (
    project_id in (
      select id from public.projects where owner_id = auth.uid()
    )
  );
