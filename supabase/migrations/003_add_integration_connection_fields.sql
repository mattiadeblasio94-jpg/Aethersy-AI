-- Add additional fields to integration_connections for better provider management
ALTER TABLE public.integration_connections
  ADD COLUMN IF NOT EXISTS provider_slug TEXT,
  ADD COLUMN IF NOT EXISTS scopes TEXT[],
  ADD COLUMN IF NOT EXISTS account_label TEXT;

-- Create index on provider_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_connections_provider_slug
  ON public.integration_connections(provider_slug);

-- Add comment to document the new columns
COMMENT ON COLUMN public.integration_connections.provider_slug IS 'Denormalized slug from integration_providers for faster queries';
COMMENT ON COLUMN public.integration_connections.scopes IS 'OAuth scopes granted to this connection';
COMMENT ON COLUMN public.integration_connections.account_label IS 'Human-readable label for the connected account (e.g. email, username)';
