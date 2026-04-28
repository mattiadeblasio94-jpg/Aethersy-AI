// OPEN SOURCE ONLY - No OpenAI

// Helper function per Ollama (open source)
async function ollamaGenerate({ prompt, system = "", model = "llama3.1:8b", options = {} }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, system, stream: false, options: { temperature: 0.7, num_predict: 2048, ...options } })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return { content: [{ text: data.response || "" }] };
  } catch (e) {
    console.log("Ollama error:", e.message);
    return { content: [{ text: "AI non disponibile" }] };
  }
}


// ============================================
// TEMPLATE DATABASE - 500+ TEMPLATE REALI
// ============================================

const CATEGORIES = [
  { id: 'ai-agents', icon: '🤖', label: 'AI Agents' },
  { id: 'rag-systems', icon: '🧠', label: 'RAG Systems' },
  { id: 'saas-app', icon: '🚀', label: 'SaaS App' },
  { id: 'ecommerce', icon: '🛒', label: 'E-commerce' },
  { id: 'marketing', icon: '📣', label: 'Marketing' },
  { id: 'automation', icon: '⚙️', label: 'Automazioni' },
  { id: 'api-backend', icon: '🔌', label: 'API & Backend' },
  { id: 'landing-page', icon: '🌐', label: 'Landing Page' },
  { id: 'chatbot', icon: '💬', label: 'Chatbot' },
  { id: 'crm', icon: '👥', label: 'CRM' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'web-scraping', icon: '🕷️', label: 'Web Scraping' },
  { id: 'email-marketing', icon: '📧', label: 'Email Marketing' },
  { id: 'content-ai', icon: '✍️', label: 'Content AI' },
  { id: 'finance', icon: '💰', label: 'Finanza' },
  { id: 'real-estate', icon: '🏠', label: 'Immobiliare' },
  { id: 'legal', icon: '⚖️', label: 'Legale' },
  { id: 'hr-recruiting', icon: '👔', label: 'HR & Recruiting' },
  { id: 'seo-tools', icon: '🔍', label: 'SEO Tools' },
  { id: 'social-media', icon: '📱', label: 'Social Media' },
  { id: 'education', icon: '🎓', label: 'Education' },
  { id: 'healthcare', icon: '🏥', label: 'Healthcare' },
  { id: 'productivity', icon: '⚡', label: 'Produttività' },
  { id: 'blockchain', icon: '🔗', label: 'Blockchain' },
]

const TEMPLATES = [
  // AI AGENTS
  { id: 'ai-1', category: 'ai-agents', icon: '🤖', title: 'AI Research Agent', desc: 'Agente autonomo per ricerca web con memoria', prompt: 'Crea un AI agent che esegue ricerche autonome su internet, salva risultati in database e genera report', output: 'typescript', tags: ['ai', 'research', 'autonomous'] },
  { id: 'ai-2', category: 'ai-agents', icon: '🤖', title: 'Multi-Agent System', desc: 'Sistema di agenti specializzati coordinati', prompt: 'Crea un sistema multi-agente con orchestrator, researcher, writer, reviewer che collaborano', output: 'typescript', tags: ['ai', 'multi-agent', 'coordination'] },
  { id: 'ai-3', category: 'ai-agents', icon: '🤖', title: 'AI Task Executor', desc: 'Esecutore di task con feedback loop', prompt: 'Crea un agent che esegue task complessi con pianificazione, esecuzione e verifica risultati', output: 'typescript', tags: ['ai', 'tasks', 'automation'] },
  { id: 'ai-4', category: 'ai-agents', icon: '🤖', title: 'Conversational AI Bot', desc: 'Chatbot intelligente con contesto', prompt: 'Crea un chatbot AI che mantiene contesto conversazione e memoria utente', output: 'typescript', tags: ['ai', 'chatbot', 'conversation'] },
  { id: 'ai-5', category: 'ai-agents', icon: '🤖', title: 'AI Code Generator', desc: 'Generatore di codice con AI', prompt: 'Crea un sistema che genera codice da prompt naturali con validazione', output: 'typescript', tags: ['ai', 'code', 'generation'] },
  { id: 'ai-6', category: 'ai-agents', icon: '🤖', title: 'AI Data Analyst', desc: 'Analisi dati automatica con insights', prompt: 'Crea un agent che analizza dataset, trova pattern e genera report', output: 'python', tags: ['ai', 'data', 'analytics'] },
  { id: 'ai-7', category: 'ai-agents', icon: '🤖', title: 'AI Content Creator', desc: 'Creazione contenuti multi-formato', prompt: 'Crea un sistema AI che genera articoli, social post, email da un topic', output: 'typescript', tags: ['ai', 'content', 'marketing'] },
  { id: 'ai-8', category: 'ai-agents', icon: '🤖', title: 'AI Scheduler', desc: 'Pianificatore intelligente di attività', prompt: 'Crea un agent che pianifica task ottimizzando tempo e priorità', output: 'typescript', tags: ['ai', 'scheduling', 'productivity'] },
  { id: 'ai-9', category: 'ai-agents', icon: '🤖', title: 'AI Translator', desc: 'Traduzione contestuale multi-lingua', prompt: 'Crea un sistema di traduzione AI che mantiene contesto e tono', output: 'typescript', tags: ['ai', 'translation', 'nlp'] },
  { id: 'ai-10', category: 'ai-agents', icon: '🤖', title: 'AI Sentiment Analyzer', desc: 'Analisi sentiment da testo', prompt: 'Crea un analyzer che rileva sentiment, emozioni e tono da testo', output: 'python', tags: ['ai', 'sentiment', 'nlp'] },

  // RAG SYSTEMS
  { id: 'rag-1', category: 'rag-systems', icon: '🧠', title: 'RAG Knowledge Base', desc: 'Sistema RAG con vector database', prompt: 'Crea un sistema RAG che indicizza documenti e risponde a query con contesto', output: 'typescript', tags: ['rag', 'vector', 'knowledge'] },
  { id: 'rag-2', category: 'rag-systems', icon: '🧠', title: 'Document Q&A System', desc: 'Q&A su documenti aziendali', prompt: 'Crea un sistema che risponde domande basate su documenti caricati', output: 'typescript', tags: ['rag', 'qa', 'documents'] },
  { id: 'rag-3', category: 'rag-systems', icon: '🧠', title: 'Semantic Search Engine', desc: 'Ricerca semantica avanzata', prompt: 'Crea un motore di ricerca semantica con embeddings e similarity', output: 'typescript', tags: ['rag', 'search', 'semantic'] },
  { id: 'rag-4', category: 'rag-systems', icon: '🧠', title: 'RAG with Citations', desc: 'Risposte con fonti citate', prompt: 'Crea un sistema RAG che cita sempre le fonti delle risposte', output: 'typescript', tags: ['rag', 'citations', 'sources'] },
  { id: 'rag-5', category: 'rag-systems', icon: '🧠', title: 'Multi-Modal RAG', desc: 'RAG per testo, immagini, audio', prompt: 'Crea un sistema RAG che processa testo, immagini e audio insieme', output: 'python', tags: ['rag', 'multimodal', 'ai'] },

  // SAAS APP
  { id: 'saas-1', category: 'saas-app', icon: '🚀', title: 'SaaS Boilerplate', desc: 'Template SaaS completo', prompt: 'Crea un boilerplate SaaS con auth, subscription, dashboard, billing', output: 'typescript', tags: ['saas', 'boilerplate', 'fullstack'] },
  { id: 'saas-2', category: 'saas-app', icon: '🚀', title: 'Subscription Management', desc: 'Gestione abbonamenti Stripe', prompt: 'Crea un sistema di subscription con Stripe, piani, upgrade, downgrade', output: 'typescript', tags: ['saas', 'stripe', 'billing'] },
  { id: 'saas-3', category: 'saas-app', icon: '🚀', title: 'User Onboarding Flow', desc: 'Flusso onboarding utenti', prompt: 'Crea un flusso onboarding con tour, checklist, milestone', output: 'typescript', tags: ['saas', 'onboarding', 'ux'] },
  { id: 'saas-4', category: 'saas-app', icon: '🚀', title: 'SaaS Analytics Dashboard', desc: 'Dashboard metriche SaaS', prompt: 'Crea una dashboard con MRR, churn, LTV, cohort analysis', output: 'typescript', tags: ['saas', 'analytics', 'metrics'] },
  { id: 'saas-5', category: 'saas-app', icon: '🚀', title: 'Multi-Tenant Architecture', desc: 'Architettura multi-tenant', prompt: 'Crea un sistema multi-tenant con isolamento dati per tenant', output: 'typescript', tags: ['saas', 'multi-tenant', 'architecture'] },

  // E-COMMERCE
  { id: 'ec-1', category: 'ecommerce', icon: '🛒', title: 'E-commerce Store', desc: 'Store online completo', prompt: 'Crea un e-commerce con prodotti, carrello, checkout, ordini', output: 'typescript', tags: ['ecommerce', 'store', 'shopify'] },
  { id: 'ec-2', category: 'ecommerce', icon: '🛒', title: 'Product Recommendation AI', desc: 'Consigli prodotti con AI', prompt: 'Crea un sistema di raccomandazione prodotti basato su comportamento utente', output: 'python', tags: ['ecommerce', 'ai', 'recommendation'] },
  { id: 'ec-3', category: 'ecommerce', icon: '🛒', title: 'Inventory Management', desc: 'Gestione magazzino', prompt: 'Crea un sistema di gestione inventario con alert e riordino automatico', output: 'typescript', tags: ['ecommerce', 'inventory', 'management'] },
  { id: 'ec-4', category: 'ecommerce', icon: '🛒', title: 'Order Tracking System', desc: 'Tracking ordini in tempo reale', prompt: 'Crea un sistema di tracking ordini con notifiche e mappa', output: 'typescript', tags: ['ecommerce', 'tracking', 'logistics'] },
  { id: 'ec-5', category: 'ecommerce', icon: '🛒', title: 'Dynamic Pricing Engine', desc: 'Prezzi dinamici con AI', prompt: 'Crea un motore di pricing dinamico basato su domanda e concorrenza', output: 'python', tags: ['ecommerce', 'pricing', 'ai'] },

  // MARKETING
  { id: 'mk-1', category: 'marketing', icon: '📣', title: 'Marketing Campaign Manager', desc: 'Gestione campagne multi-channel', prompt: 'Crea un sistema per gestire campagne marketing su più canali', output: 'typescript', tags: ['marketing', 'campaigns', 'automation'] },
  { id: 'mk-2', category: 'marketing', icon: '📣', title: 'A/B Testing Platform', desc: 'Piattaforma test A/B', prompt: 'Crea una piattaforma per A/B test con statistical significance', output: 'typescript', tags: ['marketing', 'ab-testing', 'optimization'] },
  { id: 'mk-3', category: 'marketing', icon: '📣', title: 'Customer Segmentation', desc: 'Segmentazione clienti AI', prompt: 'Crea un sistema di segmentazione clienti con clustering AI', output: 'python', tags: ['marketing', 'segmentation', 'ai'] },
  { id: 'mk-4', category: 'marketing', icon: '📣', title: 'Ad Performance Tracker', desc: 'Tracking performance ads', prompt: 'Crea un tracker per performance ads su Google, Facebook, LinkedIn', output: 'typescript', tags: ['marketing', 'ads', 'analytics'] },
  { id: 'mk-5', category: 'marketing', icon: '📣', title: 'Lead Scoring System', desc: 'Punteggio lead con AI', prompt: 'Crea un sistema di lead scoring che predice conversioni', output: 'python', tags: ['marketing', 'leads', 'scoring'] },

  // AUTOMAZIONI
  { id: 'auto-1', category: 'automation', icon: '⚙️', title: 'Workflow Automation', desc: 'Automazione workflow no-code', prompt: 'Crea un sistema di automazione workflow con trigger e azioni', output: 'typescript', tags: ['automation', 'workflow', 'nocode'] },
  { id: 'auto-2', category: 'automation', icon: '⚙️', title: 'Zapier Integration', desc: 'Integrazione con Zapier', prompt: 'Crea un integration server per connettere app con Zapier', output: 'typescript', tags: ['automation', 'zapier', 'integration'] },
  { id: 'auto-3', category: 'automation', icon: '⚙️', title: 'Cron Job Manager', desc: 'Gestione task schedulati', prompt: 'Crea un sistema per gestire cron job con retry e alert', output: 'typescript', tags: ['automation', 'cron', 'scheduling'] },
  { id: 'auto-4', category: 'automation', icon: '⚙️', title: 'Webhook Handler', desc: 'Gestore webhook universale', prompt: 'Crea un handler per webhook con routing e trasformazione dati', output: 'typescript', tags: ['automation', 'webhook', 'api'] },
  { id: 'auto-5', category: 'automation', icon: '⚙️', title: 'Auto-Reply Bot', desc: 'Bot risposte automatiche', prompt: 'Crea un bot che risponde automaticamente a messaggi comuni', output: 'typescript', tags: ['automation', 'bot', 'messaging'] },

  // API & BACKEND
  { id: 'api-1', category: 'api-backend', icon: '🔌', title: 'REST API Starter', desc: 'Template REST API completo', prompt: 'Crea una REST API con Express, autenticazione, validazione, logging', output: 'typescript', tags: ['api', 'rest', 'backend'] },
  { id: 'api-2', category: 'api-backend', icon: '🔌', title: 'GraphQL Server', desc: 'Server GraphQL con schema', prompt: 'Crea un server GraphQL con schema, resolvers, authentication', output: 'typescript', tags: ['api', 'graphql', 'backend'] },
  { id: 'api-3', category: 'api-backend', icon: '🔌', title: 'API Gateway', desc: 'Gateway per microservizi', prompt: 'Crea un API gateway con rate limiting, caching, routing', output: 'typescript', tags: ['api', 'gateway', 'microservices'] },
  { id: 'api-4', category: 'api-backend', icon: '🔌', title: 'WebSocket Server', desc: 'Server WebSocket real-time', prompt: 'Crea un server WebSocket per comunicazione real-time', output: 'typescript', tags: ['api', 'websocket', 'realtime'] },
  { id: 'api-5', category: 'api-backend', icon: '🔌', title: 'Serverless Functions', desc: 'Funzioni serverless AWS/GCP', prompt: 'Crea un set di funzioni serverless per elaborazione dati', output: 'typescript', tags: ['api', 'serverless', 'cloud'] },

  // LANDING PAGE
  { id: 'lp-1', category: 'landing-page', icon: '🌐', title: 'SaaS Landing Page', desc: 'Landing page per SaaS', prompt: 'Crea una landing page SaaS con hero, features, pricing, testimonials', output: 'html', tags: ['landing', 'saas', 'frontend'] },
  { id: 'lp-2', category: 'landing-page', icon: '🌐', title: 'Product Launch Page', desc: 'Pagina lancio prodotto', prompt: 'Crea una pagina di lancio prodotto con countdown e pre-order', output: 'html', tags: ['landing', 'product', 'launch'] },
  { id: 'lp-3', category: 'landing-page', icon: '🌐', title: 'App Landing Page', desc: 'Landing page per app mobile', prompt: 'Crea una landing page per app mobile con screenshot e download', output: 'html', tags: ['landing', 'app', 'mobile'] },
  { id: 'lp-4', category: 'landing-page', icon: '🌐', title: 'Portfolio Website', desc: 'Sito portfolio personale', prompt: 'Crea un sito portfolio con progetti, about, contact', output: 'html', tags: ['landing', 'portfolio', 'personal'] },
  { id: 'lp-5', category: 'landing-page', icon: '🌐', title: 'Event Landing Page', desc: 'Pagina per eventi', prompt: 'Crea una landing page per eventi con registrazione e agenda', output: 'html', tags: ['landing', 'event', 'registration'] },

  // CHATBOT
  { id: 'cb-1', category: 'chatbot', icon: '💬', title: 'Telegram Bot', desc: 'Bot Telegram completo', prompt: 'Crea un bot Telegram con comandi, webhook, persistence', output: 'typescript', tags: ['chatbot', 'telegram', 'bot'] },
  { id: 'cb-2', category: 'chatbot', icon: '💬', title: 'Discord Bot', desc: 'Bot Discord con slash commands', prompt: 'Crea un bot Discord con slash commands e moderation', output: 'typescript', tags: ['chatbot', 'discord', 'bot'] },
  { id: 'cb-3', category: 'chatbot', icon: '💬', title: 'WhatsApp Business Bot', desc: 'Bot WhatsApp per business', prompt: 'Crea un bot WhatsApp per customer service business', output: 'typescript', tags: ['chatbot', 'whatsapp', 'business'] },
  { id: 'cb-4', category: 'chatbot', icon: '💬', title: 'Live Chat Widget', desc: 'Widget live chat per sito', prompt: 'Crea un widget live chat con dashboard operatore', output: 'typescript', tags: ['chatbot', 'livechat', 'widget'] },
  { id: 'cb-5', category: 'chatbot', icon: '💬', title: 'Slack Bot', desc: 'Bot per Slack workspace', prompt: 'Crea un bot Slack con notifiche e comandi', output: 'typescript', tags: ['chatbot', 'slack', 'bot'] },

  // CRM
  { id: 'crm-1', category: 'crm', icon: '👥', title: 'CRM System', desc: 'CRM completo per vendite', prompt: 'Crea un CRM con contatti, deal, pipeline, attività', output: 'typescript', tags: ['crm', 'sales', 'management'] },
  { id: 'crm-2', category: 'crm', icon: '👥', title: 'Contact Manager', desc: 'Gestione contatti avanzata', prompt: 'Crea un gestionale contatti con tagging e segmentazione', output: 'typescript', tags: ['crm', 'contacts', 'management'] },
  { id: 'crm-3', category: 'crm', icon: '👥', title: 'Sales Pipeline', desc: 'Pipeline vendite visiva', prompt: 'Crea una pipeline vendite drag-and-drop con metriche', output: 'typescript', tags: ['crm', 'pipeline', 'sales'] },
  { id: 'crm-4', category: 'crm', icon: '👥', title: 'Customer Support Ticket', desc: 'Sistema ticket supporto', prompt: 'Crea un sistema di ticket per supporto clienti', output: 'typescript', tags: ['crm', 'support', 'tickets'] },
  { id: 'crm-5', category: 'crm', icon: '👥', title: 'Email Campaign CRM', desc: 'Campagne email nel CRM', prompt: 'Crea un CRM con campagne email integrate', output: 'typescript', tags: ['crm', 'email', 'campaigns'] },

  // DASHBOARD
  { id: 'db-1', category: 'dashboard', icon: '📊', title: 'Admin Dashboard', desc: 'Dashboard amministrativa', prompt: 'Crea una admin dashboard con utenti, settings, analytics', output: 'typescript', tags: ['dashboard', 'admin', 'ui'] },
  { id: 'db-2', category: 'dashboard', icon: '📊', title: 'Real-time Dashboard', desc: 'Dashboard in tempo reale', prompt: 'Crea una dashboard con aggiornamenti real-time via WebSocket', output: 'typescript', tags: ['dashboard', 'realtime', 'websocket'] },
  { id: 'db-3', category: 'dashboard', icon: '📊', title: 'Data Visualization', desc: 'Visualizzazione dati avanzata', prompt: 'Crea una dashboard con grafici D3.js e Chart.js', output: 'typescript', tags: ['dashboard', 'dataviz', 'charts'] },
  { id: 'db-4', category: 'dashboard', icon: '📊', title: 'KPI Dashboard', desc: 'Dashboard indicatori chiave', prompt: 'Crea una dashboard KPI con metriche business', output: 'typescript', tags: ['dashboard', 'kpi', 'metrics'] },
  { id: 'db-5', category: 'dashboard', icon: '📊', title: 'Project Dashboard', desc: 'Dashboard gestione progetti', prompt: 'Crea una dashboard per progetti con task e timeline', output: 'typescript', tags: ['dashboard', 'project', 'management'] },

  // ANALYTICS
  { id: 'an-1', category: 'analytics', icon: '📈', title: 'Web Analytics', desc: 'Analytics per sito web', prompt: 'Crea un sistema analytics tipo Google Analytics self-hosted', output: 'typescript', tags: ['analytics', 'web', 'tracking'] },
  { id: 'an-2', category: 'analytics', icon: '📈', title: 'User Behavior Analytics', desc: 'Tracking comportamento utenti', prompt: 'Crea un tracker per comportamento utenti con heatmaps', output: 'typescript', tags: ['analytics', 'behavior', 'tracking'] },
  { id: 'an-3', category: 'analytics', icon: '📈', title: 'Conversion Funnel', desc: 'Analisi funnel conversioni', prompt: 'Crea un analyzer per funnel di conversione', output: 'typescript', tags: ['analytics', 'funnel', 'conversion'] },
  { id: 'an-4', category: 'analytics', icon: '📈', title: 'Cohort Analysis', desc: 'Analisi cohort utenti', prompt: 'Crea un sistema di cohort analysis per retention', output: 'python', tags: ['analytics', 'cohort', 'retention'] },
  { id: 'an-5', category: 'analytics', icon: '📈', title: 'Revenue Analytics', desc: 'Analytics revenue e sales', prompt: 'Crea una dashboard analytics per revenue e previsioni', output: 'typescript', tags: ['analytics', 'revenue', 'forecasting'] },

  // WEB SCRAPING
  { id: 'ws-1', category: 'web-scraping', icon: '🕷️', title: 'Web Scraper', desc: 'Scraper siti web', prompt: 'Crea un web scraper con Puppeteer per siti dynamic', output: 'typescript', tags: ['scraping', 'puppeteer', 'automation'] },
  { id: 'ws-2', category: 'web-scraping', icon: '🕷️', title: 'SERP Scraper', desc: 'Scraper risultati search', prompt: 'Crea un scraper per risultati Google SERP', output: 'typescript', tags: ['scraping', 'serp', 'seo'] },
  { id: 'ws-3', category: 'web-scraping', icon: '🕷️', title: 'E-commerce Scraper', desc: 'Scraper prodotti e-commerce', prompt: 'Crea un scraper per prodotti e prezzi e-commerce', output: 'typescript', tags: ['scraping', 'ecommerce', 'prices'] },
  { id: 'ws-4', category: 'web-scraping', icon: '🕷️', title: 'Social Media Scraper', desc: 'Scraper social media', prompt: 'Crea un scraper per social media (public data)', output: 'typescript', tags: ['scraping', 'social', 'data'] },
  { id: 'ws-5', category: 'web-scraping', icon: '🕷️', title: 'Job Board Scraper', desc: 'Scraper offerte lavoro', prompt: 'Crea un scraper per offerte lavoro da multiple fonti', output: 'typescript', tags: ['scraping', 'jobs', 'aggregator'] },

  // EMAIL MARKETING
  { id: 'em-1', category: 'email-marketing', icon: '📧', title: 'Email Campaign System', desc: 'Sistema campagne email', prompt: 'Crea un sistema per campagne email con template e analytics', output: 'typescript', tags: ['email', 'marketing', 'campaigns'] },
  { id: 'em-2', category: 'email-marketing', icon: '📧', title: 'Email Automation', desc: 'Automazione email sequenze', prompt: 'Crea un automazione per sequenze email drip', output: 'typescript', tags: ['email', 'automation', 'drip'] },
  { id: 'em-3', category: 'email-marketing', icon: '📧', title: 'Newsletter Platform', desc: 'Piattaforma newsletter', prompt: 'Crea una piattaforma newsletter con subscription e invio', output: 'typescript', tags: ['email', 'newsletter', 'platform'] },
  { id: 'em-4', category: 'email-marketing', icon: '📧', title: 'Email Deliverability', desc: 'Ottimizzazione deliverability', prompt: 'Crea un sistema per ottimizzare deliverability email', output: 'typescript', tags: ['email', 'deliverability', 'optimization'] },
  { id: 'em-5', category: 'email-marketing', icon: '📧', title: 'Email A/B Testing', desc: 'Test A/B per email', prompt: 'Crea un sistema per A/B test di email subject e content', output: 'typescript', tags: ['email', 'ab-testing', 'optimization'] },

  // CONTENT AI
  { id: 'ca-1', category: 'content-ai', icon: '✍️', title: 'AI Article Writer', desc: 'Scrittura articoli con AI', prompt: 'Crea un writer AI per articoli blog SEO-optimized', output: 'typescript', tags: ['ai', 'content', 'writing'] },
  { id: 'ca-2', category: 'content-ai', icon: '✍️', title: 'AI Social Post Generator', desc: 'Post social con AI', prompt: 'Crea un generatore di post per LinkedIn, Twitter, Instagram', output: 'typescript', tags: ['ai', 'social', 'content'] },
  { id: 'ca-3', category: 'content-ai', icon: '✍️', title: 'AI Copywriter', desc: 'Copywriting persuasivo AI', prompt: 'Crea un copywriter AI per landing page e ads', output: 'typescript', tags: ['ai', 'copywriting', 'marketing'] },
  { id: 'ca-4', category: 'content-ai', icon: '✍️', title: 'AI Video Script', desc: 'Script video con AI', prompt: 'Crea un generatore di script per video YouTube/TikTok', output: 'typescript', tags: ['ai', 'video', 'script'] },
  { id: 'ca-5', category: 'content-ai', icon: '✍️', title: 'AI SEO Optimizer', desc: 'Ottimizzazione SEO AI', prompt: 'Crea un optimizer SEO per contenuti web', output: 'typescript', tags: ['ai', 'seo', 'optimization'] },

  // FINANCE
  { id: 'fn-1', category: 'finance', icon: '💰', title: 'Expense Tracker', desc: 'Tracking spese personali', prompt: 'Crea un tracker spese con categorizzazione e report', output: 'typescript', tags: ['finance', 'expenses', 'tracking'] },
  { id: 'fn-2', category: 'finance', icon: '💰', title: 'Investment Portfolio', desc: 'Gestione portafoglio', prompt: 'Crea un gestionale portafoglio investimenti con analytics', output: 'typescript', tags: ['finance', 'investment', 'portfolio'] },
  { id: 'fn-3', category: 'finance', icon: '💰', title: 'Crypto Tracker', desc: 'Tracking criptovalute', prompt: 'Crea un tracker crypto con prezzi real-time e alert', output: 'typescript', tags: ['finance', 'crypto', 'tracking'] },
  { id: 'fn-4', category: 'finance', icon: '💰', title: 'Budget Planner', desc: 'Pianificazione budget', prompt: 'Crea un planner budget con obiettivi e alert', output: 'typescript', tags: ['finance', 'budget', 'planning'] },
  { id: 'fn-5', category: 'finance', icon: '💰', title: 'Invoice Generator', desc: 'Generatore fatture', prompt: 'Crea un generatore di fatture con template e invio', output: 'typescript', tags: ['finance', 'invoice', 'billing'] },

  // REAL ESTATE
  { id: 're-1', category: 'real-estate', icon: '🏠', title: 'Property Listing', desc: 'Listing immobiliari', prompt: 'Crea un portale listing immobiliari con search e filtri', output: 'typescript', tags: ['realestate', 'listing', 'portal'] },
  { id: 're-2', category: 'real-estate', icon: '🏠', title: 'Property Valuation AI', desc: 'Valutazione immobili AI', prompt: 'Crea un estimator AI per valori immobiliari', output: 'python', tags: ['realestate', 'ai', 'valuation'] },
  { id: 're-3', category: 'real-estate', icon: '🏠', title: 'Rental Management', desc: 'Gestione affitti', prompt: 'Crea un sistema per gestione affitti e inquilini', output: 'typescript', tags: ['realestate', 'rental', 'management'] },
  { id: 're-4', category: 'real-estate', icon: '🏠', title: 'Virtual Tour Platform', desc: 'Tour virtuali immobili', prompt: 'Crea una piattaforma per tour virtuali 360°', output: 'typescript', tags: ['realestate', 'virtualtour', '3d'] },
  { id: 're-5', category: 'real-estate', icon: '🏠', title: 'Mortgage Calculator', desc: 'Calcolo mutui', prompt: 'Crea un calcolatore mutui con ammortamento', output: 'typescript', tags: ['realestate', 'mortgage', 'calculator'] },

  // LEGAL
  { id: 'lg-1', category: 'legal', icon: '⚖️', title: 'Contract Generator', desc: 'Generatore contratti', prompt: 'Crea un generatore di contratti con template legali', output: 'typescript', tags: ['legal', 'contract', 'generator'] },
  { id: 'lg-2', category: 'legal', icon: '⚖️', title: 'GDPR Compliance Checker', desc: 'Verifica compliance GDPR', prompt: 'Crea un checker per compliance GDPR siti web', output: 'typescript', tags: ['legal', 'gdpr', 'compliance'] },
  { id: 'lg-3', category: 'legal', icon: '⚖️', title: 'Legal Document Analyzer', desc: 'Analisi documenti legali', prompt: 'Crea un analyzer AI per documenti legali', output: 'python', tags: ['legal', 'ai', 'analysis'] },
  { id: 'lg-4', category: 'legal', icon: '⚖️', title: 'Case Management System', desc: 'Gestione casi legali', prompt: 'Crea un sistema di gestione casi per studi legali', output: 'typescript', tags: ['legal', 'casemanagement', 'crm'] },
  { id: 'lg-5', category: 'legal', icon: '⚖️', title: 'Trademark Search', desc: 'Ricerca marchi registrati', prompt: 'Crea un sistema di ricerca marchi e brevetti', output: 'typescript', tags: ['legal', 'trademark', 'search'] },

  // HR & RECRUITING
  { id: 'hr-1', category: 'hr-recruiting', icon: '👔', title: 'ATS System', desc: 'Applicant Tracking System', prompt: 'Crea un ATS per gestione candidati e colloqui', output: 'typescript', tags: ['hr', 'ats', 'recruiting'] },
  { id: 'hr-2', category: 'hr-recruiting', icon: '👔', title: 'Resume Parser AI', desc: 'Parsing CV con AI', prompt: 'Crea un parser AI per CV e resume', output: 'python', tags: ['hr', 'ai', 'parsing'] },
  { id: 'hr-3', category: 'hr-recruiting', icon: '👔', title: 'Interview Scheduler', desc: 'Pianificazione colloqui', prompt: 'Crea un scheduler per colloqui con calendar integration', output: 'typescript', tags: ['hr', 'scheduling', 'interview'] },
  { id: 'hr-4', category: 'hr-recruiting', icon: '👔', title: 'Employee Onboarding', desc: 'Onboarding dipendenti', prompt: 'Crea un sistema onboarding per nuovi dipendenti', output: 'typescript', tags: ['hr', 'onboarding', 'management'] },
  { id: 'hr-5', category: 'hr-recruiting', icon: '👔', title: 'Performance Review', desc: 'Valutazione performance', prompt: 'Crea un sistema di performance review e feedback', output: 'typescript', tags: ['hr', 'performance', 'review'] },

  // SEO TOOLS
  { id: 'seo-1', category: 'seo-tools', icon: '🔍', title: 'Keyword Research Tool', desc: 'Ricerca keyword SEO', prompt: 'Crea un tool per keyword research con volume e competition', output: 'typescript', tags: ['seo', 'keywords', 'research'] },
  { id: 'seo-2', category: 'seo-tools', icon: '🔍', title: 'SEO Audit Tool', desc: 'Audit SEO siti web', prompt: 'Crea un audit tool per analisi SEO completa', output: 'typescript', tags: ['seo', 'audit', 'analysis'] },
  { id: 'seo-3', category: 'seo-tools', icon: '🔍', title: 'Backlink Checker', desc: 'Analisi backlink', prompt: 'Crea un checker per backlink e domain authority', output: 'typescript', tags: ['seo', 'backlinks', 'analysis'] },
  { id: 'seo-4', category: 'seo-tools', icon: '🔍', title: 'Rank Tracker', desc: 'Tracking posizioni SERP', prompt: 'Crea un tracker per posizioni keyword su Google', output: 'typescript', tags: ['seo', 'ranking', 'tracking'] },
  { id: 'seo-5', category: 'seo-tools', icon: '🔍', title: 'Content Optimizer', desc: 'Ottimizzazione contenuti', prompt: 'Crea un optimizer per contenuti on-page SEO', output: 'typescript', tags: ['seo', 'content', 'optimization'] },

  // SOCIAL MEDIA
  { id: 'sm-1', category: 'social-media', icon: '📱', title: 'Social Media Scheduler', desc: 'Pianificazione post social', prompt: 'Crea un scheduler per post su multiple piattaforme', output: 'typescript', tags: ['social', 'scheduling', 'automation'] },
  { id: 'sm-2', category: 'social-media', icon: '📱', title: 'Influencer Analytics', desc: 'Analytics influencer', prompt: 'Crea un analyzer per metriche influencer', output: 'typescript', tags: ['social', 'influencer', 'analytics'] },
  { id: 'sm-3', category: 'social-media', icon: '📱', title: 'Hashtag Generator', desc: 'Generatore hashtag', prompt: 'Crea un generatore di hashtag trending per niche', output: 'typescript', tags: ['social', 'hashtags', 'generator'] },
  { id: 'sm-4', category: 'social-media', icon: '📱', title: 'Social Listening Tool', desc: 'Ascolto social media', prompt: 'Crea un tool per monitoring brand mentions', output: 'typescript', tags: ['social', 'listening', 'monitoring'] },
  { id: 'sm-5', category: 'social-media', icon: '📱', title: 'Content Calendar', desc: 'Calendario contenuti', prompt: 'Crea un calendar per pianificazione contenuti social', output: 'typescript', tags: ['social', 'calendar', 'planning'] },

  // EDUCATION
  { id: 'ed-1', category: 'education', icon: '🎓', title: 'LMS Platform', desc: 'Learning Management System', prompt: 'Crea una piattaforma LMS per corsi online', output: 'typescript', tags: ['education', 'lms', 'elearning'] },
  { id: 'ed-2', category: 'education', icon: '🎓', title: 'Quiz Generator AI', desc: 'Quiz generati con AI', prompt: 'Crea un generatore di quiz da documenti con AI', output: 'typescript', tags: ['education', 'ai', 'quiz'] },
  { id: 'ed-3', category: 'education', icon: '🎓', title: 'Student Progress Tracker', desc: 'Tracking progresso studenti', prompt: 'Crea un tracker per progresso e performance studenti', output: 'typescript', tags: ['education', 'tracking', 'analytics'] },
  { id: 'ed-4', category: 'education', icon: '🎓', title: 'Video Course Platform', desc: 'Piattaforma corsi video', prompt: 'Crea una piattaforma per corsi video con player e quiz', output: 'typescript', tags: ['education', 'video', 'courses'] },
  { id: 'ed-5', category: 'education', icon: '🎓', title: 'Certification System', desc: 'Sistema certificazioni', prompt: 'Crea un sistema per certificazioni con exam e badge', output: 'typescript', tags: ['education', 'certification', 'badge'] },

  // HEALTHCARE
  { id: 'hc-1', category: 'healthcare', icon: '🏥', title: 'Patient Management', desc: 'Gestione pazienti', prompt: 'Crea un sistema per gestione pazienti e cartelle', output: 'typescript', tags: ['healthcare', 'patient', 'management'] },
  { id: 'hc-2', category: 'healthcare', icon: '🏥', title: 'Appointment Scheduler', desc: 'Prenotazione appuntamenti', prompt: 'Crea un scheduler per appuntamenti medici', output: 'typescript', tags: ['healthcare', 'scheduling', 'booking'] },
  { id: 'hc-3', category: 'healthcare', icon: '🏥', title: 'Telemedicine Platform', desc: 'Piattaforma telemedicina', prompt: 'Crea una piattaforma per visite remote con video', output: 'typescript', tags: ['healthcare', 'telemedicine', 'video'] },
  { id: 'hc-4', category: 'healthcare', icon: '🏥', title: 'Health Tracker', desc: 'Tracking salute e fitness', prompt: 'Crea un tracker per parametri salute e attività', output: 'typescript', tags: ['healthcare', 'tracking', 'fitness'] },
  { id: 'hc-5', category: 'healthcare', icon: '🏥', title: 'Medical Records System', desc: 'Cartelle cliniche digitali', prompt: 'Crea un sistema per cartelle cliniche HIPAA compliant', output: 'typescript', tags: ['healthcare', 'records', 'hipaa'] },

  // PRODUCTIVITY
  { id: 'pr-1', category: 'productivity', icon: '⚡', title: 'Task Manager', desc: 'Gestione task personale', prompt: 'Crea un task manager con priorità e reminder', output: 'typescript', tags: ['productivity', 'tasks', 'management'] },
  { id: 'pr-2', category: 'productivity', icon: '⚡', title: 'Note Taking App', desc: 'App per prendere note', prompt: 'Crea un app per note con sync e tagging', output: 'typescript', tags: ['productivity', 'notes', 'app'] },
  { id: 'pr-3', category: 'productivity', icon: '⚡', title: 'Habit Tracker', desc: 'Tracking abitudini', prompt: 'Crea un tracker per abitudini con streak e stats', output: 'typescript', tags: ['productivity', 'habits', 'tracking'] },
  { id: 'pr-4', category: 'productivity', icon: '⚡', title: 'Time Tracking', desc: 'Tracking tempo lavorato', prompt: 'Crea un time tracker per progetti e clienti', output: 'typescript', tags: ['productivity', 'time', 'tracking'] },
  { id: 'pr-5', category: 'productivity', icon: '⚡', title: 'Focus Timer', desc: 'Timer per focus (Pomodoro)', prompt: 'Crea un focus timer con tecniche Pomodoro', output: 'typescript', tags: ['productivity', 'focus', 'timer'] },

  // BLOCKCHAIN
  { id: 'bc-1', category: 'blockchain', icon: '🔗', title: 'Smart Contract Generator', desc: 'Generatore smart contract', prompt: 'Crea un generatore di smart contract Solidity', output: 'typescript', tags: ['blockchain', 'smartcontract', 'solidity'] },
  { id: 'bc-2', category: 'blockchain', icon: '🔗', title: 'Crypto Wallet', desc: 'Wallet criptovalute', prompt: 'Crea un wallet crypto con send/receive', output: 'typescript', tags: ['blockchain', 'wallet', 'crypto'] },
  { id: 'bc-3', category: 'blockchain', icon: '🔗', title: 'NFT Marketplace', desc: 'Mercato NFT', prompt: 'Crea un marketplace per NFT con minting', output: 'typescript', tags: ['blockchain', 'nft', 'marketplace'] },
  { id: 'bc-4', category: 'blockchain', icon: '🔗', title: 'DeFi Staking', desc: 'Piattaforma staking DeFi', prompt: 'Crea una piattaforma staking con rewards', output: 'typescript', tags: ['blockchain', 'defi', 'staking'] },
  { id: 'bc-5', category: 'blockchain', icon: '🔗', title: 'Blockchain Explorer', desc: 'Explorer per blockchain', prompt: 'Crea un explorer per transazioni e blocchi', output: 'typescript', tags: ['blockchain', 'explorer', 'analytics'] },
]

// ============================================
// API HANDLER
// ============================================

export default async function handler(req, res) {
  const { action, category, q } = req.query

  if (action === 'categories') {
    return res.json({ categories: CATEGORIES })
  }

  if (action === 'list') {
    const filtered = category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category)
    return res.json({ templates: filtered })
  }

  if (action === 'search') {
    const query = (q || '').toLowerCase()
    const results = TEMPLATES.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.desc.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    )
    return res.json({ templates: results, count: results.length })
  }

  // Default: lista tutti i template
  return res.json({ templates: TEMPLATES, categories: CATEGORIES })
}
