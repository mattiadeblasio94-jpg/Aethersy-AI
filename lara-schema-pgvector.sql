-- ============================================
-- LARA OS — SCHEMA COMPLETO CON PGVECTOR
-- ============================================
-- Esegui questo SQL nel tuo progetto Supabase:
-- https://app.supabase.com/project/_/sql
-- ============================================

-- ESTENSIONI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector per RAG

-- ============================================
-- TABELLA: UTENTI
-- ============================================
CREATE TABLE IF NOT EXISTS lara_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  platform TEXT DEFAULT 'web',
  telegram_chat_id TEXT DEFAULT NULL,
  plan TEXT DEFAULT 'free',
  tokens_used INTEGER DEFAULT 0,
  tokens_limit INTEGER DEFAULT 100000,
  business_context JSONB DEFAULT '{}',  -- Missione, obiettivi, KPI
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_user_id ON lara_users(user_id);
CREATE INDEX idx_users_telegram ON lara_users(telegram_chat_id);
CREATE INDEX idx_users_plan ON lara_users(plan);
CREATE INDEX idx_business_context ON lara_users USING GIN(business_context);

-- ============================================
-- TABELLA: MEMORIA RAG (PGVECTOR)
-- ============================================
CREATE TABLE IF NOT EXISTS lara_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',  -- fact, preference, project, business
  embedding vector(1536),  -- OpenAI text-embedding-3-small
  confidence FLOAT DEFAULT 1.0,
  source TEXT DEFAULT 'conversation',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_memory_user_id ON lara_memory(user_id);
CREATE INDEX idx_memory_category ON lara_memory(category);
CREATE INDEX idx_memory_embedding ON lara_memory USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_memory_metadata ON lara_memory USING GIN(metadata);

-- ============================================
-- TABELLA: SESSIONI CHAT
-- ============================================
CREATE TABLE IF NOT EXISTS lara_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
  context_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sessions_user_id ON lara_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON lara_sessions(session_id);

-- ============================================
-- TABELLA: MESSAGGI CHAT
-- ============================================
CREATE TABLE IF NOT EXISTS lara_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4o',
  thought_process JSONB DEFAULT NULL,  -- Think phase
  plan JSONB DEFAULT NULL,             -- Plan phase
  execution_result JSONB DEFAULT NULL, -- Act phase
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON lara_messages(session_id);
CREATE INDEX idx_messages_user_id ON lara_messages(user_id);
CREATE INDEX idx_messages_created_at ON lara_messages(created_at DESC);

-- ============================================
-- TABELLA: TASK AUTOMATICI
-- ============================================
CREATE TABLE IF NOT EXISTS lara_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, running, done, failed
  trigger_type TEXT DEFAULT 'manual',  -- manual, scheduled, event
  trigger_config JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',  -- Plan steps
  result JSONB DEFAULT NULL,
  error TEXT DEFAULT NULL,
  priority INTEGER DEFAULT 5,
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_tasks_user_id ON lara_tasks(user_id);
CREATE INDEX idx_tasks_status ON lara_tasks(status);
CREATE INDEX idx_tasks_trigger_type ON lara_tasks(trigger_type);

-- ============================================
-- TABELLA: LOG AZIONI
-- ============================================
CREATE TABLE IF NOT EXISTS lara_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID,
  session_id TEXT DEFAULT NULL,
  user_id TEXT DEFAULT 'system',
  phase TEXT DEFAULT NULL,  -- think, plan, act, verify
  action TEXT NOT NULL,
  input JSONB DEFAULT NULL,
  output JSONB DEFAULT NULL,
  status TEXT DEFAULT 'ok',
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_task_id ON lara_logs(task_id);
CREATE INDEX idx_logs_user_id ON lara_logs(user_id);
CREATE INDEX idx_logs_action ON lara_logs(action);
CREATE INDEX idx_logs_created_at ON lara_logs(created_at DESC);
CREATE INDEX idx_logs_phase ON lara_logs(phase);

-- ============================================
-- TABELLA: CINEMA STUDIO PRESETS
-- ============================================
CREATE TABLE IF NOT EXISTS lara_cinema_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,  -- video, music, image, voice
  name TEXT NOT NULL,
  settings JSONB NOT NULL,  -- Camera, lighting, audio params
  created_by TEXT DEFAULT 'system',
  user_id TEXT,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cinema_type ON lara_cinema_presets(type);
CREATE INDEX idx_cinema_name ON lara_cinema_presets(name);
CREATE INDEX idx_cinema_user_id ON lara_cinema_presets(user_id);
CREATE INDEX idx_cinema_settings ON lara_cinema_presets USING GIN(settings);

-- ============================================
-- TABELLA: BUSINESS ENGINE
-- ============================================
CREATE TABLE IF NOT EXISTS lara_business_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  executive_summary TEXT,
  mission TEXT,
  vision TEXT,
  goals JSONB DEFAULT '[]',  -- [{objective, kpi, target, deadline}]
  market_analysis JSONB DEFAULT '{}',
  revenue_model JSONB DEFAULT '{}',
  visual_style JSONB DEFAULT '{}',  -- Auto-sync con Cinema Studio
  tone_of_voice JSONB DEFAULT '{}',  -- Auto-sync con Marketing
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_user_id ON lara_business_plans(user_id);
CREATE INDEX idx_business_status ON lara_business_plans(status);

-- ============================================
-- TABELLA: MARKETPLACE SAAS
-- ============================================
CREATE TABLE IF NOT EXISTS lara_marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,  -- agent, bot, app, template
  category TEXT,
  price_monthly INTEGER DEFAULT 0,  -- cents
  features JSONB DEFAULT '[]',
  technical_specs JSONB DEFAULT '{}',
  deploy_script TEXT,  -- Script per deploy automatico
  thumbnail_url TEXT,
  demo_url TEXT,
  status TEXT DEFAULT 'draft',  -- draft, published, archived
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketplace_type ON lara_marketplace(type);
CREATE INDEX idx_marketplace_category ON lara_marketplace(category);
CREATE INDEX idx_marketplace_status ON lara_marketplace(status);

-- ============================================
-- TABELLA: EVENT LISTENERS (PROACTIVE ENGINE)
-- ============================================
CREATE TABLE IF NOT EXISTS lara_event_listeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- api_error, resource_high, opportunity, scheduled
  target TEXT NOT NULL,  -- URL, resource, metric
  condition JSONB DEFAULT '{}',  -- {threshold, operator}
  action JSONB DEFAULT '{}',  -- {type: telegram_notify, email, webhook}
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON lara_event_listeners(user_id);
CREATE INDEX idx_events_type ON lara_event_listeners(event_type);
CREATE INDEX idx_events_active ON lara_event_listeners(is_active);

-- ============================================
-- FUNZIONE: Match Memoria RAG
-- ============================================
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  filter_user_id TEXT,
  match_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  key TEXT,
  value TEXT,
  category TEXT,
  confidence FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.key,
    m.value,
    m.category,
    m.confidence,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM lara_memory m
  WHERE m.user_id = filter_user_id
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- ============================================
-- FUNZIONE: Auto-sync Business → Cinema
-- ============================================
CREATE OR REPLACE FUNCTION sync_business_to_cinema()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando un business plan viene aggiornato, aggiorna il contesto utente
  UPDATE lara_users
  SET
    business_context = business_context || NEW.visual_style,
    settings = jsonb_set(
      settings,
      '{tone_of_voice}',
      COALESCE(NEW.tone_of_voice, '{}'::jsonb)
    )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_business_to_cinema
  AFTER UPDATE ON lara_business_plans
  FOR EACH ROW
  WHEN (NEW.visual_style IS NOT NULL)
  EXECUTE FUNCTION sync_business_to_cinema();

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lara_tasks_updated_at
  BEFORE UPDATE ON lara_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lara_memory_updated_at
  BEFORE UPDATE ON lara_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lara_users_updated_at
  BEFORE UPDATE ON lara_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lara_business_updated_at
  BEFORE UPDATE ON lara_business_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATI INIZIALI
-- ============================================

-- Utente demo
INSERT INTO lara_users (user_id, name, email, platform, plan, tokens_limit, settings, business_context)
VALUES (
  'demo_user',
  'Demo User',
  'demo@aethersy.ai',
  'web',
  'pro',
  1000000,
  '{"theme": "dark", "language": "it"}'::jsonb,
  '{"mission": "Costruire SaaS innovativi", "goals": ["10k MRR", "1000 utenti"], "vertical": "AI Tools"}'::jsonb
)
ON CONFLICT (user_id) DO NOTHING;

-- Memoria iniziale Lara
INSERT INTO lara_memory (user_id, key, value, category, source, confidence) VALUES
  ('demo_user', 'name', 'Demo User', 'fact', 'system', 1.0),
  ('demo_user', 'language', 'italiano', 'preference', 'system', 1.0),
  ('demo_user', 'plan', 'pro', 'fact', 'system', 1.0),
  ('demo_user', 'timezone', 'Europe/Rome', 'preference', 'system', 1.0),
  ('demo_user', 'mission', 'Costruire SaaS innovativi', 'business', 'system', 0.95),
  ('demo_user', 'tone_of_voice', 'professionale ma amichevole', 'preference', 'system', 0.9)
ON CONFLICT (user_id, key) DO NOTHING;

-- Cinema Presets
INSERT INTO lara_cinema_presets (type, name, settings, created_by, is_public) VALUES
  ('video', 'cinematic', '{
    "camera": {"iso": 800, "shutterSpeed": "1/48", "aperture": "f/2.8", "focalLength": 50},
    "lighting": {"type": "3-point", "kelvinTemperature": 5600},
    "fps": 24,
    "style": "cinematic"
  }'::jsonb, 'system', true),
  ('video', 'documentary', '{
    "camera": {"iso": 400, "shutterSpeed": "1/60", "aperture": "f/4", "focalLength": 35},
    "lighting": {"type": "natural", "kelvinTemperature": 4500},
    "fps": 30,
    "style": "documentary"
  }'::jsonb, 'system', true),
  ('image', 'portrait', '{
    "model": "flux-pro",
    "aspectRatio": "4:3",
    "camera": {"iso": 100, "aperture": "f/1.8", "focalLength": 85},
    "depthOfField": "shallow",
    "style": "photorealistic"
  }'::jsonb, 'system', true),
  ('music', 'epic', '{
    "genre": "orchestral",
    "bpm": 120,
    "key": "D minor",
    "stems": true,
    "mastering": true,
    "mood": ["epic", "dramatic", "powerful"]
  }'::jsonb, 'system', true)
ON CONFLICT DO NOTHING;

-- Event Listeners demo
INSERT INTO lara_event_listeners (user_id, event_type, target, condition, action, is_active) VALUES
  ('demo_user', 'resource_high', 'ecs_cpu', '{"threshold": 80, "operator": ">"}'::jsonb, '{"type": "telegram_notify", "message": "⚠️ CPU ECS alta"}'::jsonb, true),
  ('demo_user', 'resource_high', 'ecs_memory', '{"threshold": 80, "operator": ">"}'::jsonb, '{"type": "telegram_notify", "message": "⚠️ RAM ECS alta"}'::jsonb, true),
  ('demo_user', 'opportunity', 'marketplace_trend', '{"keyword": "AI video", "threshold": 1000}'::jsonb, '{"type": "telegram_notify", "message": "📈 Trend rilevato"}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICA FINALE
-- ============================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'lara_%' ORDER BY tablename;
