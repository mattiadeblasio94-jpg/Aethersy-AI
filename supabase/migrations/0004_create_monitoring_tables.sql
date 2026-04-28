-- ============================================
-- MONITORAGGIO LEAD & ACTIVITY SYSTEM
-- ============================================

-- 1. ACTIVITY LOGS - Traccia ogni azione utente
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'api_call', 'payment', 'registration'
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- 2. TOKEN USAGE - Consumo token per modello AI
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL, -- 'qwen-max', 'llama3.1', etc.
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_model_name ON token_usage(model_name);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at);

-- 3. LEAD TRACKING - Tracking lead da registrazione a pagamento
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  source TEXT DEFAULT 'direct', -- 'direct', 'referral', 'organic', 'paid'
  referral_code TEXT,
  referred_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'new', -- 'new', 'active', 'converted', 'churned'
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);

-- 4. ADMIN USERS - Utenti con accesso admin
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  permissions JSONB DEFAULT '{"dashboard": true, "users": true, "billing": true, "logs": true, "settings": true}',
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 5. SESSIONS LIVE - Sessioni attive (Redis-like)
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions(session_token);

-- 6. EMAIL LOGS - Log email inviate da Lara
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'welcome', 'abandoned_cart', 'report', 'payment'
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'opened', 'clicked'
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- 7. STRIPE EVENTS - Log eventi Stripe
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL, -- 'checkout.session.completed', 'customer.subscription.updated', etc.
  customer_id TEXT,
  user_id UUID REFERENCES users(id),
  event_data JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX idx_stripe_events_customer_id ON stripe_events(customer_id);
CREATE INDEX idx_stripe_events_user_id ON stripe_events(user_id);

-- 8. ADMIN SETTINGS - Configurazioni admin
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNZIONI E TRIGGER
-- ============================================

-- Funzione per aggiornare last_active_at su leads
CREATE OR REPLACE FUNCTION update_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads SET last_active_at = NOW() WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lead_activity
AFTER INSERT ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_lead_activity();

-- Funzione per creare lead automaticamente alla registrazione
CREATE OR REPLACE FUNCTION create_lead_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leads (user_id, email, full_name, status)
  VALUES (NEW.id, NEW.email, NEW.full_name, 'new')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_lead_on_registration
AFTER INSERT ON users
FOR EACH ROW
WHEN (NEW.email IS NOT NULL)
EXECUTE FUNCTION create_lead_on_registration();

-- Funzione per pulire sessioni scadute
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM active_sessions WHERE last_seen_at < NOW() - INTERVAL '24 hours';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERIMENTO ADMIN PRINCIPALE
-- ============================================

-- L'utente principale (telefono +393395093888) diventa ADMIN con permessi illimitati
-- Questo viene gestito via codice all'inizializzazione

COMMENT ON TABLE activity_logs IS 'Log di tutte le attività utente';
COMMENT ON TABLE token_usage IS 'Consumo token API per modello AI';
COMMENT ON TABLE leads IS 'Tracking lead da registrazione a conversione';
COMMENT ON TABLE admin_users IS 'Utenti con accesso al pannello admin';
COMMENT ON TABLE active_sessions IS 'Sessioni attive in tempo reale';
COMMENT ON TABLE email_logs IS 'Log email inviate da Lara';
COMMENT ON TABLE stripe_events IS 'Eventi Stripe per monitoraggio pagamenti';
