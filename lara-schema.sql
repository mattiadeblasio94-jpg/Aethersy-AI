-- ============================================
-- LARA AGENT — SCHEMA COMPLETO SUPABASE
-- ============================================
-- Esegui questo SQL nel tuo progetto Supabase:
-- https://app.supabase.com/project/_/sql
-- ============================================

-- ESTENSIONI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELLA: SESSIONI CHAT
-- ============================================
CREATE TABLE IF NOT EXISTS lara_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
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
  status TEXT DEFAULT 'pending',
  trigger_type TEXT DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
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

-- ============================================
-- TABELLA: MEMORIA UTENTE
-- ============================================
CREATE TABLE IF NOT EXISTS lara_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  confidence FLOAT DEFAULT 1.0,
  source TEXT DEFAULT 'conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_memory_user_id ON lara_memory(user_id);
CREATE INDEX idx_memory_category ON lara_memory(category);

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
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_user_id ON lara_users(user_id);
CREATE INDEX idx_users_telegram ON lara_users(telegram_chat_id);
CREATE INDEX idx_users_plan ON lara_users(plan);

-- ============================================
-- TRIGGER AUTO UPDATE updated_at
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

-- ============================================
-- DATI INIZIALI
-- ============================================

-- Utente demo
INSERT INTO lara_users (user_id, name, email, platform, plan, tokens_limit, settings)
VALUES ('demo_user', 'Demo User', 'demo@aethersy.ai', 'web', 'pro', 1000000, '{"theme": "dark", "language": "it"}')
ON CONFLICT (user_id) DO NOTHING;

-- Memoria iniziale Lara
INSERT INTO lara_memory (user_id, key, value, category, source) VALUES
  ('demo_user', 'name', 'Demo User', 'fact', 'system'),
  ('demo_user', 'language', 'italiano', 'preference', 'system'),
  ('demo_user', 'plan', 'pro', 'fact', 'system'),
  ('demo_user', 'timezone', 'Europe/Rome', 'preference', 'system')
ON CONFLICT (user_id, key) DO NOTHING;

-- ============================================
-- VERIFICA FINALE
-- ============================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'lara_%' ORDER BY tablename;
