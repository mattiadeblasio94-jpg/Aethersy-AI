-- Tipi di provider (telegram, slack, github, google, airtable, ecc.)
create table public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, -- es. 'telegram', 'slack', 'github', 'google', 'airtable'
  name text not null,
  category text not null, -- 'messaging', 'storage', 'pm', 'crm', 'design', 'ads', etc.
  created_at timestamptz default now()
);

-- Connessione di un utente/progetto a un provider
create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  provider_id uuid references public.integration_providers(id) on delete cascade,
  display_name text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Webhook registrati per un'integrazione
create table public.integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.integration_connections(id) on delete cascade,
  external_id text, -- id del webhook lato provider
  url text not null,
  event_types text[],
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_integration_connections_owner on public.integration_connections(owner_id);
create index idx_integration_connections_project on public.integration_connections(project_id);
create index idx_integration_connections_provider on public.integration_connections(provider_id);
create index idx_integration_webhooks_connection on public.integration_webhooks(connection_id);

-- RLS policies
alter table public.integration_providers enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_webhooks enable row level security;

-- Providers are readable by all authenticated users
create policy "Providers are viewable by authenticated users"
  on public.integration_providers
  for select
  to authenticated
  using (true);

-- Users can only see their own connections
create policy "Users can view own connections"
  on public.integration_connections
  for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Users can insert own connections"
  on public.integration_connections
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can delete own connections"
  on public.integration_connections
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Users can manage webhooks for their connections
create policy "Users can view webhooks for own connections"
  on public.integration_webhooks
  for select
  to authenticated
  using (
    exists (
      select 1 from public.integration_connections
      where id = connection_id and owner_id = auth.uid()
    )
  );

create policy "Users can insert webhooks for own connections"
  on public.integration_webhooks
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.integration_connections
      where id = connection_id and owner_id = auth.uid()
    )
  );

create policy "Users can delete webhooks for own connections"
  on public.integration_webhooks
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.integration_connections
      where id = connection_id and owner_id = auth.uid()
    )
  );
