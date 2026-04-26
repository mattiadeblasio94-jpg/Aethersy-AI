// 500+ AI Templates for the Terminal
// Each: { id, category, icon, title, desc, prompt, tags, output }

export const TEMPLATE_CATEGORIES = [
  { id: 'agents',      icon: '🤖', label: 'AI Agents' },
  { id: 'rag',         icon: '🧠', label: 'RAG Systems' },
  { id: 'saas',        icon: '🚀', label: 'SaaS App' },
  { id: 'ecommerce',   icon: '🛒', label: 'E-commerce' },
  { id: 'marketing',   icon: '📣', label: 'Marketing' },
  { id: 'automation',  icon: '⚙️', label: 'Automazioni' },
  { id: 'api',         icon: '🔌', label: 'API & Backend' },
  { id: 'landing',     icon: '🌐', label: 'Landing Page' },
  { id: 'chatbot',     icon: '💬', label: 'Chatbot' },
  { id: 'crm',         icon: '👥', label: 'CRM' },
  { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
  { id: 'analytics',   icon: '📈', label: 'Analytics' },
  { id: 'scraping',    icon: '🕷️', label: 'Web Scraping' },
  { id: 'email',       icon: '📧', label: 'Email Marketing' },
  { id: 'content',     icon: '✍️', label: 'Content AI' },
  { id: 'finance',     icon: '💰', label: 'Finanza' },
  { id: 'realestate',  icon: '🏠', label: 'Immobiliare' },
  { id: 'legal',       icon: '⚖️', label: 'Legale' },
  { id: 'hr',          icon: '👔', label: 'HR & Recruiting' },
  { id: 'seo',         icon: '🔍', label: 'SEO Tools' },
  { id: 'social',      icon: '📱', label: 'Social Media' },
  { id: 'education',   icon: '🎓', label: 'Education' },
  { id: 'health',      icon: '🏥', label: 'Healthcare' },
  { id: 'productivity',icon: '⚡', label: 'Produttività' },
  { id: 'blockchain',  icon: '🔗', label: 'Blockchain' },
];

const T = (id, category, icon, title, desc, prompt, tags = [], output = 'code') => ({
  id, category, icon, title, desc, prompt, tags, output,
});

export const TEMPLATES = [

// ─── AI AGENTS ────────────────────────────────────────────────────────────────
T('ag001','agents','🤖','Research Agent completo','Agent che ricerca su web, sintetizza e cita fonti',
`Crea un AI Research Agent completo in Python con:
- Integrazione Tavily API per ricerca web
- LangChain per orchestrazione
- Memoria conversazionale (Redis)
- Output strutturato con citazioni numerate [1][2][3]
- Rate limiting e retry logic
- Export risultati in Markdown/PDF
Includi setup, requirements.txt e istruzioni.`,'langchain,tavily,redis,python'),

T('ag002','agents','🤖','Email Outreach Agent','Agent che scrive e invia email personalizzate automaticamente',
`Crea un Email Outreach Agent in Python che:
- Legge lista prospect da CSV/Google Sheets
- Personalizza email con Claude AI basandosi su profilo LinkedIn/web
- Invia via SendGrid/SMTP con rate limiting
- Traccia aperture e click
- Genera report performance
- Gestisce follow-up automatici
Stack: Python, anthropic, sendgrid, pandas`,'email,outreach,automation'),

T('ag003','agents','🤖','Social Media Agent','Pubblica automaticamente su tutti i social',
`Crea un Social Media Automation Agent che:
- Genera contenuti con AI (testi, hashtag, CTA)
- Pubblica su Instagram, Twitter/X, LinkedIn, Facebook
- Gestisce calendario editoriale
- Analizza engagement e ottimizza
- Risponde ai commenti automaticamente
- Repurposes contenuti per ogni piattaforma
Stack: Python, openai/anthropic, tweepy, facebook-sdk, instagrapi`,'social,automation,content'),

T('ag004','agents','🤖','Lead Qualification Agent','Qualifica automaticamente i lead dal CRM',
`Crea un Lead Qualification Agent che:
- Si integra con HubSpot/Salesforce via API
- Analizza i lead con AI (budget, authority, need, timeline)
- Assegna score da 0-100
- Categorizza in: hot/warm/cold
- Invia notifiche Slack per hot leads
- Aggiorna CRM automaticamente
Stack: Python, anthropic, hubspot-api, slack-sdk`,'leads,crm,sales'),

T('ag005','agents','🤖','Customer Support Agent','Risolve ticket di supporto automaticamente',
`Crea un Customer Support Agent intelligente con:
- Integrazione Zendesk/Freshdesk
- Classificazione automatica ticket per categoria e urgenza
- Risposte automatiche per domande frequenti
- Escalation intelligente per problemi complessi
- Knowledge base RAG per risposte accurate
- Dashboard metriche (CSAT, tempo risposta, risoluzione)
Stack: Python, anthropic, langchain, pinecone/chroma`,'support,customer,helpdesk'),

T('ag006','agents','🤖','Data Analysis Agent','Analizza dataset e genera report automaticamente',
`Crea un Data Analysis Agent che:
- Accetta CSV, Excel, JSON, database SQL
- Analisi esplorativa automatica (statistiche, correlazioni, outlier)
- Genera visualizzazioni (matplotlib, plotly)
- Risponde a domande in linguaggio naturale sul dataset
- Produce report PDF con insights e raccomandazioni
- Integrazione con Google Sheets/BigQuery
Stack: Python, anthropic, pandas, matplotlib, plotly, sqlalchemy`,'data,analytics,reporting'),

T('ag007','agents','🤖','SEO Content Agent','Genera articoli SEO-ottimizzati in automatico',
`Crea un SEO Content Agent che:
- Ricerca keyword con Semrush/Ahrefs API
- Analizza competitor top 10 SERP
- Genera articoli 2000+ parole completamente ottimizzati
- Ottimizza meta tags, schema markup, internal linking
- Pubblica su WordPress via API
- Traccia ranking nel tempo
Stack: Python, anthropic, semrush-api, wordpress-api`,'seo,content,wordpress'),

T('ag008','agents','🤖','Invoice Processing Agent','Elabora e registra fatture automaticamente',
`Crea un Invoice Processing Agent che:
- Estrae dati da fatture PDF con OCR + AI
- Valida fornitore, importi, IVA, codici
- Registra su QuickBooks/Xero via API
- Invia per approvazione su Slack
- Gestisce dispute e riconciliazioni
- Export report contabilità mensile
Stack: Python, anthropic, pdf-extract, quickbooks-sdk`,'finance,accounting,automation'),

T('ag009','agents','🤖','Recruiting Agent','Seleziona e contatta candidati automaticamente',
`Crea un AI Recruiting Agent che:
- Pubblica job posting su LinkedIn, Indeed, Glassdoor
- Analizza e ranking CV con AI
- Filtra candidati per match score
- Invia screening email personalizzate
- Pianifica interview via Calendly
- Genera report candidate pipeline
Stack: Python, anthropic, linkedin-api, calendly-api`,'hr,recruiting,automation'),

T('ag010','agents','🤖','Price Monitor Agent','Monitora prezzi competitor in tempo reale',
`Crea un Price Monitoring Agent che:
- Scrape prezzi da Amazon, eBay, siti competitor
- Notifica variazioni di prezzo significative (>5%)
- Analizza trend prezzi con grafici
- Suggerisce repricing ottimale con AI
- Dashboard real-time prezzi
- Alert Telegram/email per cambiamenti
Stack: Python, playwright, anthropic, redis, telegram-bot`,'ecommerce,pricing,monitoring'),

T('ag011','agents','🤖','Meeting Summarizer Agent','Trascrive e riassume meeting automaticamente',
`Crea un Meeting Summarizer Agent che:
- Si integra con Zoom/Google Meet/Teams
- Trascrive meeting in real-time con Whisper
- Genera riassunto strutturato (decisioni, action items, next steps)
- Assegna task ai partecipanti via Asana/Trello
- Invia email recap a tutti i partecipanti
- Archivia in Notion/Confluence
Stack: Python, openai-whisper, anthropic, zoom-api`,'productivity,meetings,automation'),

T('ag012','agents','🤖','Compliance Monitor Agent','Monitora compliance aziendale automaticamente',
`Crea un Compliance Monitoring Agent che:
- Monitora regolamenti GDPR, SOC2, ISO 27001
- Scansiona documenti per violazioni potenziali
- Genera report di compliance mensili
- Alert per scadenze certificazioni
- Suggerisce azioni correttive con priorità
- Audit log completo con timestamp
Stack: Python, anthropic, langchain, postgresql`,'legal,compliance,monitoring'),

T('ag013','agents','🤖','Market Research Agent','Analisi di mercato completa automatizzata',
`Crea un Market Research Agent che:
- Ricerca trend di settore da 20+ fonti
- Analizza competitor (pricing, features, positioning)
- Estrae dati da report industriali (Gartner, McKinsey)
- Monitora menzioni brand sui social
- Genera report mercato mensile in PDF
- Dashboard interattiva con filtri
Stack: Python, anthropic, tavily, selenium, matplotlib`,'research,market,analysis'),

T('ag014','agents','🤖','Content Repurposing Agent','Trasforma 1 contenuto in 20 formati diversi',
`Crea un Content Repurposing Agent che:
- Prende 1 articolo/podcast/video come input
- Genera: post LinkedIn, tweet thread, email newsletter, script reel Instagram, post Facebook, snippet TikTok, slides presentazione, thread Reddit
- Adatta tono e formato per ogni piattaforma
- Crea immagini con DALL-E/Midjourney API
- Schedula tutto automaticamente
Stack: Python, anthropic, buffer-api, canva-api`,'content,social,automation'),

T('ag015','agents','🤖','Financial Advisor Agent','Analizza portafoglio e suggerisce investimenti',
`Crea un Financial Advisor Agent che:
- Analizza portafoglio investimenti attuale
- Fetch dati mercato real-time (Yahoo Finance, Alpha Vantage)
- Valuta rischio e rendimento con modelli quantitativi
- Suggerisce ribilanciamento ottimale
- Simula scenari di mercato (bull/bear/neutral)
- Genera report personalizzati per ogni profilo rischio
Stack: Python, anthropic, yfinance, numpy, plotly`,'finance,investing,analysis'),

T('ag016','agents','🤖','Knowledge Base Agent','Risponde su documenti aziendali con RAG',
`Crea un Knowledge Base Agent RAG-powered che:
- Ingesta PDF, Word, Excel, siti web, Confluence, Notion
- Chunking e embedding con OpenAI/local models
- Retrieval semantico con Pinecone/Qdrant/ChromaDB
- Risponde citando le fonti esatte
- Interfaccia chat web responsive
- Admin panel per gestire documenti
Stack: Python, langchain, openai, pinecone, fastapi, react`,'rag,knowledge,chatbot'),

T('ag017','agents','🤖','E-commerce Ops Agent','Gestisce ordini, inventory e spedizioni automaticamente',
`Crea un E-commerce Operations Agent che:
- Sincronizza inventory tra Shopify/WooCommerce e warehouse
- Gestisce ordini e fulfillment automatico
- Genera etichette spedizione (DHL, UPS, Poste)
- Gestisce resi e rimborsi
- Alert per stock basso o esaurito
- Dashboard operativa con KPI
Stack: Python, shopify-api, anthropic, shipping-apis`,'ecommerce,operations,automation'),

T('ag018','agents','🤖','Bug Triage Agent','Analizza e prioritizza bug automaticamente',
`Crea un Bug Triage Agent che:
- Si integra con GitHub Issues, Jira, Linear
- Classifica bug per severity e impatto (P0/P1/P2/P3)
- Suggerisce fix basandosi su codebase simili
- Assegna al developer più adatto
- Stima effort di risoluzione
- Weekly digest con bug stats
Stack: Python, anthropic, github-api, jira-api`,'devops,bugs,automation'),

T('ag019','agents','🤖','Contract Review Agent','Analizza contratti legali automaticamente',
`Crea un Contract Review Agent che:
- Analizza contratti PDF con AI
- Identifica clausole rischiose o non standard
- Confronta con template aziendale
- Suggerisce modifiche e negoziazioni
- Genera summary esecutivo per decisori
- Traccia versioni e modifiche
Stack: Python, anthropic, pdf-extract, langchain`,'legal,contracts,ai'),

T('ag020','agents','🤖','Influencer Outreach Agent','Trova e contatta influencer automaticamente',
`Crea un Influencer Outreach Agent che:
- Ricerca influencer per niche e follower count
- Analizza engagement rate e audience quality
- Genera email personalizzate di outreach
- Traccia risposte e negoziazioni
- Gestisce campagne e deliverable
- ROI tracking per ogni collaborazione
Stack: Python, anthropic, instagram-api, hunter-io`,'marketing,influencer,outreach'),

// ─── RAG SYSTEMS ──────────────────────────────────────────────────────────────
T('r001','rag','🧠','RAG su PDF aziendali','Sistema RAG per documentazione interna',
`Crea un sistema RAG completo per PDF aziendali:
- Upload multipli PDF via UI drag&drop
- Estrazione testo con PyPDF2/pdfplumber
- Chunking intelligente (512 token, overlap 50)
- Embedding con OpenAI text-embedding-3-small
- Vector store Pinecone/Qdrant
- Query con reranking e citation
- API REST FastAPI
- Frontend React con chat UI
Stack: Python, langchain, openai, pinecone, fastapi, react, tailwind`,'rag,pdf,langchain'),

T('r002','rag','🧠','RAG su sito web','Crea un chatbot dal tuo sito web',
`Crea un sistema RAG per siti web che:
- Crawler automatico del sito (Scrapy/BeautifulSoup)
- Pulizia HTML e estrazione contenuto rilevante
- Chunking per pagine e sezioni
- Embedding e indicizzazione real-time
- Chat widget embeddabile (snippet JS)
- Risponde come "esperto del sito"
- Dashboard usage e analytics
Stack: Python, scrapy, langchain, openai, chroma, fastapi`,'rag,website,chatbot,embed'),

T('r003','rag','🧠','RAG su Notion/Confluence','Knowledge base AI dalle tue note',
`Crea un RAG system per Notion/Confluence che:
- Sincronizzazione automatica via API
- Aggiornamento incrementale (solo modifiche)
- Struttura gerarchica preservata
- Metadati (autore, data, tag) nel retrieval
- Permessi utente rispettati
- Interfaccia Slack bot per query
Stack: Python, notion-api, confluence-api, langchain, weaviate`,'rag,notion,confluence,knowledge'),

T('r004','rag','🧠','RAG su Database SQL','Interroga database con linguaggio naturale',
`Crea un Text-to-SQL RAG system che:
- Analizza schema database automaticamente
- Genera SQL da domande in linguaggio naturale
- Valida e ottimizza le query prima dell'esecuzione
- Spiega i risultati in linguaggio comprensibile
- Genera visualizzazioni automatiche (grafici, tabelle)
- Supporta PostgreSQL, MySQL, SQLite, BigQuery
Stack: Python, langchain, sqlalchemy, openai, plotly`,'rag,sql,database,natural-language'),

T('r005','rag','🧠','RAG Multimodale','RAG su immagini, tabelle e testo',
`Crea un sistema RAG multimodale che elabora:
- Testo normale con chunking semantico
- Immagini con descrizione AI (GPT-4V/Claude)
- Tabelle Excel/CSV con understanding strutturale
- Slide PowerPoint con context visivo
- Audio/video con trascrizione Whisper
Query unificata su tutti i formati
Stack: Python, langchain, openai-gpt4v, anthropic, chroma`,'rag,multimodal,images,tables'),

T('r006','rag','🧠','Customer FAQ RAG','Chatbot FAQ auto-aggiornante',
`Crea un Customer FAQ Chatbot RAG che:
- Import da Zendesk, Intercom, CSV, Google Sheets
- Auto-learning da ticket risolti
- Risponde in 10+ lingue automaticamente
- Escalation se confidence < threshold
- Widget HTML embeddabile
- Dashboard: domande più frequenti, gap knowledge
Stack: Python, langchain, openai, redis, fastapi, vanilla-js`,'rag,faq,customer-support,widget'),

T('r007','rag','🧠','RAG per E-learning','Tutor AI per materiali didattici',
`Crea un AI Tutor RAG-based che:
- Ingesta corsi video (trascrizione), PDF, slide
- Risponde a domande degli studenti con context preciso
- Genera quiz automatici dal materiale
- Traccia progress individuale studente
- Adatta spiegazioni al livello dell'utente
- Genera flashcard automaticamente
Stack: Python, langchain, openai, postgresql, fastapi, react`,'rag,education,elearning,tutor'),

T('r008','rag','🧠','Legal RAG System','Analisi documenti legali con RAG',
`Crea un Legal Document RAG system che:
- Analizza contratti, sentenze, normative
- Risponde a domande legali con citazioni precise
- Confronta clausole tra documenti diversi
- Identifica rischi e anomalie
- Export analisi in Word/PDF
- Access control per avvocati/clienti
Stack: Python, langchain, openai, postgresql, fastapi`,'rag,legal,documents,analysis'),

T('r009','rag','🧠','Medical RAG','Assistente medico su letteratura scientifica',
`Crea un Medical Literature RAG che:
- Indicizza PubMed, ClinicalTrials, linee guida cliniche
- Risponde a domande cliniche con evidence-based answers
- Cita studi con PMID e livello di evidenza
- Alert per interazioni farmacologiche
- Ricerca per ICD-10, farmaci, procedure
Stack: Python, langchain, openai, elasticsearch, fastapi`,'rag,medical,pubmed,clinical'),

T('r010','rag','🧠','RAG Real-Time','RAG con aggiornamento live da news/feed',
`Crea un Real-Time RAG system che:
- Aggancia RSS feed, API news, Twitter
- Aggiornamento embedding ogni ora automaticamente
- Risponde su notizie delle ultime 24h
- Sentiment analysis automatica delle fonti
- Alert per topic specifici
- Dashboard trending topics
Stack: Python, langchain, openai, redis, pinecone, fastapi`,'rag,realtime,news,streaming'),

// ─── SAAS APP ─────────────────────────────────────────────────────────────────
T('s001','saas','🚀','SaaS Subscription Platform','Piattaforma SaaS completa con billing',
`Crea una SaaS Platform completa con:
- Auth (JWT + refresh tokens + OAuth Google/GitHub)
- Stripe billing: Free/Pro/Enterprise tier
- Gestione piano: upgrade, downgrade, cancel
- Usage metering e rate limiting
- Admin dashboard
- Email onboarding (welcome, activation, churn)
- API documentata con Swagger
Stack: Node.js/FastAPI, PostgreSQL, Stripe, Redis, React/Next.js`,'saas,billing,stripe,auth'),

T('s002','saas','🚀','Project Management SaaS','Alternativa ad Asana/Monday per team',
`Crea un Project Management SaaS con:
- Workspace per team
- Board Kanban drag&drop
- Gantt chart interattivo
- Gestione task, subtask, dipendenze
- Time tracking con timer
- File upload e commenti
- Notifiche real-time (WebSocket)
- Report avanzati
Stack: Next.js, PostgreSQL, Prisma, Socket.io, Stripe`,'saas,projectmanagement,team,kanban'),

T('s003','saas','🚀','AI Writing SaaS','Tool di scrittura AI tipo Jasper/Copy.ai',
`Crea un AI Writing SaaS con:
- 50+ template (blog, ads, email, social, SEO)
- Editor rich text con AI inline suggestions
- Brand voice customization
- Plagiarism checker integrato
- SEO scoring in real-time
- Workspace team con collaboration
- Export in Word, PDF, HTML
Stack: Next.js, Anthropic/OpenAI, PostgreSQL, Stripe, TipTap editor`,'saas,writing,ai,content'),

T('s004','saas','🚀','Analytics SaaS','Dashboard analytics tipo Mixpanel/Amplitude',
`Crea un Analytics SaaS che:
- Script JS da installare su qualsiasi sito
- Traccia pageview, eventi custom, conversion
- Dashboard con funnel, retention, cohort analysis
- Heatmap e session recording
- A/B testing integrato
- Alert per anomalie traffico
- Privacy-first (no cookies, GDPR compliant)
Stack: Node.js, ClickHouse, Vue.js/React, TimescaleDB`,'saas,analytics,tracking,privacy'),

T('s005','saas','🚀','Invoicing SaaS','Software fatturazione online tipo FreshBooks',
`Crea un Invoicing SaaS con:
- Creazione fatture con template personalizzabili
- Invio automatico via email con payment link
- Integrazione Stripe per pagamento online
- Reminder automatici per pagamenti in ritardo
- Report IVA e contabilità
- Multi-currency e multi-lingua
- Integrazione QuickBooks/Xero
Stack: Next.js, PostgreSQL, Stripe, SendGrid, Prisma`,'saas,invoicing,billing,accounting'),

T('s006','saas','🚀','Form Builder SaaS','Builder form tipo Typeform/JotForm',
`Crea un Form Builder SaaS con:
- Editor drag&drop visuale
- Logica condizionale avanzata
- Tipi campo: testo, numero, rating, file upload, firma digitale, pagamento
- Embedding su qualsiasi sito
- Notifiche email/Slack per risposte
- Dashboard analytics risposte
- Export CSV/Excel
Stack: React, Node.js, PostgreSQL, Stripe, S3`,'saas,forms,dragdrop,nocode'),

T('s007','saas','🚀','Scheduling SaaS','Alternativa a Calendly per professionisti',
`Crea un Scheduling SaaS con:
- Sincronizzazione Google/Outlook Calendar
- Link prenotazione personalizzabile
- Disponibilità automatica
- Videochiamata Zoom/Meet link auto-generato
- Pagamento al momento della prenotazione (Stripe)
- Reminder SMS/email automatici
- Team scheduling e round-robin
Stack: Next.js, Google APIs, Stripe, Twilio, PostgreSQL`,'saas,scheduling,calendar,booking'),

T('s008','saas','🚀','Feedback Collection SaaS','Raccolta feedback utenti tipo Hotjar/Canny',
`Crea un Feedback SaaS con:
- Widget feedback in-app (survey, NPS, CSAT)
- Roadmap pubblica votabile dagli utenti
- Changelog con annunci
- Integrazione con Slack, Linear, Jira
- AI per categorizzazione automatica feedback
- Priority score basato su impatto e richieste
Stack: React, Node.js, PostgreSQL, WebSocket`,'saas,feedback,product,roadmap'),

T('s009','saas','🚀','Email Marketing SaaS','Alternativa a Mailchimp per creator',
`Crea un Email Marketing SaaS con:
- Editor email drag&drop
- Segmentazione lista avanzata
- Automation workflow visuale
- A/B testing subject line e contenuto
- Analytics: open rate, click, unsubscribe
- AI per ottimizzazione orario invio
- GDPR compliance integrata
Stack: Next.js, SendGrid/Postmark, PostgreSQL, Redis, BullMQ`,'saas,email,marketing,automation'),

T('s010','saas','🚀','Social Media Scheduler SaaS','Alternativa a Buffer/Hootsuite',
`Crea un Social Media Scheduler SaaS con:
- Connessione multi-account (Instagram, Twitter, LinkedIn, Facebook, TikTok)
- Calendario editoriale drag&drop
- Preview post per ogni piattaforma
- AI per generazione caption e hashtag
- Analisi best time to post
- Report engagement mensile
- Bulk import da CSV
Stack: Next.js, social APIs, PostgreSQL, BullMQ, Anthropic`,'saas,social,scheduling,content'),

// ─── E-COMMERCE ───────────────────────────────────────────────────────────────
T('e001','ecommerce','🛒','Shopify App completa','App Shopify per upselling AI',
`Crea una Shopify App per upselling con:
- Shopify Partner App con OAuth
- AI per product recommendations personalizzate
- Post-purchase upsell one-click
- Bundle creator automatico
- A/B testing offerte
- Dashboard revenue incrementale
- Webhook per ordini e carrello
Stack: Next.js, Shopify API, Prisma, Anthropic, Polaris UI`,'shopify,ecommerce,upselling,app'),

T('e002','ecommerce','🛒','E-commerce con AI search','Ricerca prodotti semantica con AI',
`Crea un sistema di ricerca AI per e-commerce:
- Embedding prodotti (descrizione, attributi, immagini)
- Ricerca semantica (trova "scarpe comode da corsa" → scarpe running)
- Filtri intelligenti con AI
- Autocomplete personalizzato
- Visual search (cerca per immagine)
- Fallback su prodotti simili
Stack: Python, FastAPI, Elasticsearch/Typesense, OpenAI, React`,'ecommerce,search,ai,semantic'),

T('e003','ecommerce','🛒','Dropshipping Automator','Automatizza dropshipping da AliExpress/Temu',
`Crea un Dropshipping Automation System che:
- Trova prodotti trending su AliExpress automaticamente
- Import prodotti su Shopify/WooCommerce con un click
- Gestisce ordini: forward automatico al fornitore
- Tracking spedizioni unificato
- Gestione resi e rimborsi automatica
- Price auto-update in base ai costi
Stack: Python, Shopify API, AliExpress API, Selenium`,'dropshipping,automation,ecommerce'),

T('e004','ecommerce','🛒','Marketplace multivendor','Marketplace tipo Amazon con multi-seller',
`Crea un Marketplace Multi-vendor con:
- Registrazione e verifica seller
- Upload prodotti con varianti
- Sistema commissioni configurabile
- Pagamenti split con Stripe Connect
- Review e rating prodotti/seller
- Dispute resolution system
- Dashboard seller con analytics
Stack: Next.js, Stripe Connect, PostgreSQL, S3, Elasticsearch`,'marketplace,multivendor,ecommerce'),

T('e005','ecommerce','🛒','AI Product Description Generator','Genera schede prodotto SEO da immagini',
`Crea un AI Product Description Generator che:
- Analizza immagine prodotto con GPT-4V/Claude
- Genera titolo, descrizione lunga, bullet points, meta tags
- Ottimizza per SEO con keyword research integrata
- Traduce automaticamente in 10+ lingue
- Import/export bulk CSV
- Integrazione diretta Shopify/WooCommerce
Stack: Next.js, OpenAI/Anthropic, SEO APIs, Shopify API`,'ecommerce,ai,descriptions,seo'),

// ─── MARKETING ────────────────────────────────────────────────────────────────
T('m001','marketing','📣','Ad Copy Generator','Genera copy ads per Google/Meta/TikTok',
`Crea un Ad Copy Generator AI con:
- Template per Google Ads (RSA, DSA)
- Meta Ads (carousel, single image, video script)
- TikTok Ads (script UGC, hook, CTA)
- LinkedIn Ads
- A/B testing suggestions
- ROAS optimization tips
- Competitor analysis from URL
Stack: Next.js, Anthropic, SerpAPI`,'marketing,ads,copy,ai'),

T('m002','marketing','📣','Marketing Strategy Generator','Piano marketing completo da prompt',
`Crea un Marketing Strategy Generator che produce:
- Analisi mercato e competitor
- Buyer persona dettagliate
- Customer journey map
- Budget allocation per canale
- Content calendar 90 giorni
- KPI e metriche di tracking
- Piano esecutivo con timeline
Export PDF/Word professionale
Stack: Next.js, Anthropic, pdfmake`,'marketing,strategy,planning,ai'),

T('m003','marketing','📣','Growth Hacking Toolkit','100+ growth hacks automatizzati',
`Crea un Growth Hacking Toolkit con:
- Libreria 100+ growth experiments testati
- A/B testing framework
- Viral loop mechanics implementabili
- Referral program engine
- Pirate metrics dashboard (AARRR)
- Experiment tracker con risultati
- AI per suggerire test basati su industry
Stack: Next.js, PostgreSQL, Anthropic`,'growth,marketing,viral,experiments'),

T('m004','marketing','📣','Cold Email System','Sistema cold email ad alta deliverability',
`Crea un Cold Email System professionale con:
- Personalization da dati LinkedIn/web
- Multi-step sequences (7+ follow-up)
- Warm-up account automatico
- Deliverability checker pre-invio
- A/B test subject + body
- Unsubscribe automatico
- Analytics: open, click, reply, meeting booked
Stack: Python, anthropic, sendgrid, postgresql`,'email,outreach,cold,sales'),

T('m005','marketing','📣','Webinar Funnel System','Funnel webinar completo dall\'opt-in alla vendita',
`Crea un Webinar Funnel System con:
- Landing page opt-in ad alta conversione
- Reminder email/SMS sequenza
- Webinar platform integrazione (Zoom, StreamYard)
- Chat moderazione automatica
- Replay page con urgency timer
- Order form con bump offer
- Follow-up post-webinar automation
Stack: Next.js, Stripe, Twilio, PostgreSQL`,'marketing,webinar,funnel,sales'),

// ─── AUTOMATION ───────────────────────────────────────────────────────────────
T('au001','automation','⚙️','Make.com Clone','No-code automation platform',
`Crea una No-Code Automation Platform simile a Make.com con:
- Visual workflow builder drag&drop
- 50+ connettori (Gmail, Slack, Notion, Airtable, Sheets, Webhooks...)
- Trigger: webhook, schedule, email, form
- Node types: transform, filter, loop, condition, AI
- Real-time execution logs
- Error handling e retry
- Deploy e monitoring
Stack: React, Node.js, BullMQ, PostgreSQL, Redis`,'automation,nocode,workflow,make'),

T('au002','automation','⚙️','Zapier Alternative','Automation platform leggera e veloce',
`Crea un'Automation Platform con:
- 30+ app integrations prebuilt
- Multi-step zaps/workflows
- Filter e formatter utilities
- Webhook builder
- Schedule trigger (cron)
- Error notifications Slack
- Usage analytics
Stack: Next.js, PostgreSQL, BullMQ, Redis`,'automation,zapier,integration,workflow'),

T('au003','automation','⚙️','Document Automation','Genera documenti da template automaticamente',
`Crea un Document Automation System con:
- Template Word/PDF con variabili dinamiche
- Form per raccolta dati
- Generazione bulk da Excel/CSV
- Firma digitale integrata
- Invio automatico via email
- Archiviazione documentale
- API REST per integrazioni
Stack: Python, docxtpl, reportlab, fastapi, postgresql`,'automation,documents,pdf,templates'),

T('au004','automation','⚙️','Data Pipeline Builder','ETL pipeline visuale no-code',
`Crea un Data Pipeline Builder con:
- Connettori source: CSV, API REST, database, S3, Google Sheets
- Transform: filter, map, join, aggregate, deduplicate
- Connettori destination: database, S3, data warehouse, API
- Scheduling automatico
- Monitoring e alerting
- Data quality checks
- Versioning pipeline
Stack: Python, Apache Airflow/Prefect, PostgreSQL, React`,'automation,etl,pipeline,data'),

T('au005','automation','⚙️','Invoice Automation','Ciclo fatturazione completamente automatizzato',
`Crea un Invoice Automation System:
- Trigger: order completato, abbonamento rinnovo, milestone progetto
- Generazione PDF fattura automatica
- Numerazione progressiva conforme normativa
- Invio email con link pagamento Stripe
- Reminder automatici (3, 7, 14 giorni)
- Reconciliazione bancaria automatica
- Export contabilità (XML, CSV, FatturePA)
Stack: Python, FastAPI, Stripe, SendGrid, ReportLab`,'automation,invoicing,billing,accounting'),

// ─── API & BACKEND ────────────────────────────────────────────────────────────
T('api001','api','🔌','REST API con Auth completa','Backend Node.js production-ready',
`Crea un REST API backend production-ready con:
- JWT Auth + refresh token rotation
- Role-based access control (RBAC)
- Rate limiting per IP e user
- Input validation con Zod/Joi
- Database: PostgreSQL + Prisma ORM
- Migrations automatiche
- OpenAPI/Swagger docs
- Test suite Jest/Supertest
- Docker + docker-compose
- GitHub Actions CI/CD
Stack: Node.js/Express o FastAPI, PostgreSQL, Redis, Docker`,'api,backend,auth,node'),

T('api002','api','🔌','GraphQL API','API GraphQL scalabile con subscriptions',
`Crea un GraphQL API con:
- Schema SDL con types, queries, mutations, subscriptions
- Resolvers con DataLoader per N+1 prevention
- Auth via JWT nel context
- File upload via multipart
- WebSocket per real-time subscriptions
- Persisted queries e query complexity limits
- Code generation TypeScript
Stack: Node.js, Apollo Server, PostgreSQL, Prisma, Redis`,'api,graphql,backend,realtime'),

T('api003','api','🔌','Microservices Architecture','Sistema microservizi con message queue',
`Crea un'architettura Microservices con:
- API Gateway (Kong/custom)
- Services: auth, users, payments, notifications, analytics
- Message broker: RabbitMQ/Kafka
- Service discovery: Consul
- Distributed tracing: Jaeger
- Centralized logging: ELK Stack
- Health checks e circuit breakers
- Docker Compose per sviluppo
Stack: Node.js/Python, PostgreSQL, Redis, RabbitMQ, Docker`,'microservices,backend,architecture,scalable'),

T('api004','api','🔌','Webhook System','Sistema webhook robusto con retry',
`Crea un Webhook Delivery System con:
- Registrazione endpoint con validazione URL
- Firma HMAC per sicurezza payload
- Retry automatico con exponential backoff
- Dead letter queue per fallimenti
- Dashboard delivery status
- Replay manuale
- Log completo tentativi
Stack: Node.js, BullMQ, Redis, PostgreSQL, Express`,'api,webhooks,events,reliability'),

T('api005','api','🔌','API Rate Limiter','Rate limiting avanzato per API',
`Crea un API Rate Limiting Service con:
- Algoritmi: token bucket, sliding window, fixed window
- Limiti per IP, API key, user, endpoint
- Redis per distributed state
- Headers standard (X-RateLimit-*)
- Whitelist/blacklist IP
- Dashboard analytics richieste
- Alert per abuse
Stack: Node.js/Nginx, Redis, Lua scripts`,'api,ratelimiting,security,performance'),

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
T('l001','landing','🌐','SaaS Landing Page','Landing page ad alta conversione per SaaS',
`Crea una SaaS Landing Page ad alta conversione con:
- Hero section con headline + subheadline + CTA primario
- Social proof (loghi clienti, testimonials, review stars)
- Feature section con 3 colonne di benefit
- How it works (3 step animati)
- Pricing table (3 tier con highlight)
- FAQ accordion
- CTA finale con urgency
- Popup exit-intent
- Google Analytics + Hotjar integrati
Stack: Next.js, Tailwind CSS, Framer Motion`,'landing,saas,conversion,marketing'),

T('l002','landing','🌐','Agency Landing Page','Landing page per agenzia digitale',
`Crea una Landing Page Agenzia con:
- Hero video background con overlay
- Portfolio case study interattivi
- Team section con bio
- Process section (discovery, strategy, execution, results)
- Metriche risultati (ROI%, leads generati, revenue)
- Form contatto con qualificazione
- Blog feed ultimi articoli
Stack: Next.js, GSAP animations, Tailwind`,'landing,agency,portfolio,creative'),

T('l003','landing','🌐','Product Hunt Launch Page','Landing page per lancio prodotto',
`Crea una Launch Landing Page con:
- Countdown timer urgency
- Coming soon con email capture
- Feature teaser (blurred/locked)
- Early bird pricing con % sconto
- Referral program per accesso anticipato
- Social sharing integrato
- Notifiche real-time iscritti
Stack: Next.js, Stripe, SendGrid, Supabase`,'landing,launch,producthunt,viral'),

// ─── CHATBOT ──────────────────────────────────────────────────────────────────
T('cb001','chatbot','💬','Customer Service Bot','Chatbot assistenza clienti multi-canale',
`Crea un Customer Service Chatbot con:
- NLU per intent recognition
- FAQ automatiche con RAG
- Escalation a agente umano (handoff)
- Integrazione WhatsApp Business, Telegram, web widget
- CRM integration (HubSpot/Salesforce)
- Analytics: satisfaction score, containment rate
- Multi-lingua (auto-detect)
Stack: Python, Rasa/Langchain, Anthropic, FastAPI`,'chatbot,customer-service,support,multilang'),

T('cb002','chatbot','💬','Sales Bot','Chatbot che qualifica e converte lead',
`Crea un AI Sales Chatbot che:
- Accoglie visitatori con messaggio personalizzato
- Qualifica con domande BANT (Budget, Authority, Need, Timeline)
- Presenta prodotti/servizi rilevanti
- Gestisce obiezioni comuni
- Prenota meeting (Calendly integration)
- Invia offerta via email
- Notifica sales team su Slack
Stack: Next.js, Anthropic, Calendly API, HubSpot`,'chatbot,sales,lead-qualification,crm'),

T('cb003','chatbot','💬','Telegram Business Bot','Bot Telegram per business automation',
`Crea un Telegram Business Bot con:
- Menu inline keyboard
- Gestione ordini e status
- Notifiche push personalizzate
- Payment integrato (Stripe/PayPal via Telegram Payments)
- Broadcast per segment utenti
- Analytics: MAU, retention, conversioni
- Admin panel web
Stack: Python, python-telegram-bot, PostgreSQL, Stripe`,'chatbot,telegram,business,payments'),

T('cb004','chatbot','💬','HR Assistant Bot','Bot per domande HR e onboarding',
`Crea un HR Assistant Bot che:
- Risponde a domande policy aziendale (ferie, rimborsi, benefit)
- Gestisce richieste ferie e assenze
- Onboarding nuovi dipendenti step-by-step
- Quiz knowledge check
- Survey employee satisfaction mensile
- Integration Slack + Microsoft Teams
Stack: Python, Anthropic, RAG, Slack SDK`,'chatbot,hr,onboarding,employees'),

// ─── CRM ──────────────────────────────────────────────────────────────────────
T('crm001','crm','👥','CRM Sales completo','CRM per team di vendita',
`Crea un CRM Sales completo con:
- Pipeline vendite drag&drop (Kanban)
- Gestione contatti e aziende
- Activity log (call, email, meeting)
- Email tracking con open rate
- Task e reminder automatici
- Report: forecast revenue, win rate, cycle time
- Import/export CSV
- Mobile responsive
Stack: Next.js, PostgreSQL, Prisma, SendGrid, Stripe`,'crm,sales,pipeline,contacts'),

T('crm002','crm','👥','CRM con AI insights','CRM con suggerimenti AI per chiudere più deal',
`Crea un AI-Powered CRM con:
- Score opportunità con AI (probability to close)
- Suggerimenti next action per ogni deal
- Analisi call recordings con insights
- Email drafting assistita da AI
- Churn prediction per clienti esistenti
- Deal coaching personalizzato
Stack: Next.js, Anthropic, PostgreSQL, Whisper`,'crm,ai,sales-intelligence,coaching'),

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
T('d001','dashboard','📊','Business Dashboard','Dashboard KPI aziendale real-time',
`Crea una Business KPI Dashboard con:
- Widget configurabili (drag&drop)
- KPI: revenue, MAU, churn, CAC, LTV, NPS
- Grafici: linee, bar, pie, funnel, heatmap
- Filtri: data range, segmento, prodotto
- Alert automatici per KPI fuori soglia
- Export PDF/Excel
- Multi-utente con permessi
Stack: React, D3.js/Recharts, PostgreSQL, FastAPI`,'dashboard,analytics,kpi,business'),

T('d002','dashboard','📊','Marketing Dashboard','Dashboard marketing con tutte le piattaforme',
`Crea un Marketing Analytics Dashboard che aggrega:
- Google Analytics 4
- Meta Ads Manager
- Google Ads
- Email marketing metrics
- Social media (Instagram, LinkedIn, Twitter)
- SEO (Search Console)
- Vista unificata con attribution
Stack: React, Next.js, Google APIs, Meta API, Recharts`,'dashboard,marketing,analytics,multi-channel'),

// ─── SEO ──────────────────────────────────────────────────────────────────────
T('seo001','seo','🔍','SEO Audit Tool','Audit SEO completo del sito',
`Crea un SEO Audit Tool che analizza:
- Technical SEO (pagespeed, robots.txt, sitemap, SSL, redirects)
- On-page (meta tags, headers, keyword density, alt text)
- Content quality score
- Backlink profile
- Competitor comparison
- Score globale con priorità fixes
- Report PDF professionale
Stack: Python, FastAPI, Lighthouse API, Ahrefs/Semrush API`,'seo,audit,technical,analysis'),

T('seo002','seo','🔍','Keyword Research AI','Ricerca keyword con AI per content strategy',
`Crea un Keyword Research Tool con:
- Seed keyword expansion (1000+ varianti)
- Search intent classification (informational, transactional, navigational)
- Difficulty vs opportunity score
- Clustering semantico per topic
- Content brief automatico per ogni keyword cluster
- SERP analysis top 10 competitor
Stack: Python, SemRush/Ahrefs API, Anthropic, React`,'seo,keywords,content-strategy,research'),

// ─── FINANCE ──────────────────────────────────────────────────────────────────
T('fin001','finance','💰','Portfolio Tracker','Traccia investimenti multi-asset real-time',
`Crea un Investment Portfolio Tracker con:
- Multi-asset: azioni, ETF, crypto, obbligazioni, immobili
- Dati real-time (Yahoo Finance, CoinGecko)
- P&L giornaliero, settimanale, mensile, annuale
- Asset allocation pie chart
- Benchmark vs S&P500, Bitcoin
- Tax report (plusvalenze, minusvalenze)
- Alert prezzo target
Stack: Next.js, PostgreSQL, Yahoo Finance API, CoinGecko API`,'finance,portfolio,investments,tracking'),

T('fin002','finance','💰','Budget Manager','Gestione budget personale e aziendale',
`Crea un Budget Management App con:
- Import automatico transazioni (CSV banca, Open Banking)
- Categorizzazione AI automatica
- Budget mensile per categoria
- Report spese con grafici
- Alert sforamento budget
- Proiezioni finanziarie 12 mesi
- Export per commercialista
Stack: Next.js, PostgreSQL, Stripe Financial Connections, Anthropic`,'finance,budget,personal,tracking'),

// ─── REAL ESTATE ──────────────────────────────────────────────────────────────
T('re001','realestate','🏠','Property Management System','Gestione proprietà immobiliari completa',
`Crea un Property Management System con:
- Gestione proprietà e unità
- Contratti affitto digitali con firma
- Riscossione affitti online (Stripe)
- Manutenzione: richieste, ticket, fornitori
- Contabilità: entrate, spese, report fiscale
- Portale inquilini self-service
- Dashboard proprietario con ROI
Stack: Next.js, PostgreSQL, Stripe, DocuSign, SendGrid`,'realestate,property,management,rental'),

T('re002','realestate','🏠','Real Estate CRM','CRM per agenti immobiliari',
`Crea un Real Estate CRM con:
- Gestione clienti (acquirenti/venditori)
- Portfolio immobili con gallery foto
- Matching automatico clienti-immobili
- Pipeline trattative con stage
- Documenti e contratti digitali
- Agenda appuntamenti
- Report commissioni
Stack: Next.js, PostgreSQL, S3, Google Calendar`,'realestate,crm,agents,properties'),

T('re003','realestate','🏠','Property Valuation AI','Stima valore immobile con AI',
`Crea un AI Property Valuation Tool che:
- Analizza indirizzo, metratura, caratteristiche
- Fetch dati comparables (OMI, agenzie)
- Modello ML per stima valore (XGBoost/LightGBM)
- Report PDF professionale con analisi
- Trend prezzi zona negli ultimi 5 anni
- Calcolo ROI per investitori
Stack: Python, scikit-learn, FastAPI, React, matplotlib`,'realestate,ai,valuation,ml'),

// ─── HR & RECRUITING ─────────────────────────────────────────────────────────
T('hr001','hr','👔','ATS System','Applicant Tracking System completo',
`Crea un ATS (Applicant Tracking System) con:
- Job posting multi-board (LinkedIn, Indeed, Glassdoor)
- Parsing CV automatico con AI
- Pipeline candidati (screening, phone, interview, offer)
- Scoring candidati vs job description
- Interview scheduling automatico
- Feedback loop interviewer
- Offer letter generation
Stack: Next.js, PostgreSQL, Anthropic, Calendly API`,'hr,ats,recruiting,hiring'),

T('hr002','hr','👔','Payroll System','Gestione paghe e buste paga automatizzata',
`Crea un Payroll System con:
- Configurazione contratti dipendenti
- Calcolo automatico stipendio (ordinario, straordinario, indennità)
- Gestione presenze e assenze
- Generazione CU e LUL
- Versamento F24 automatico
- Cedolini digitali per dipendenti
- Export per consulente del lavoro
Stack: Python, FastAPI, PostgreSQL, ReportLab`,'hr,payroll,employees,compliance'),

// ─── PRODUCTIVITY ─────────────────────────────────────────────────────────────
T('p001','productivity','⚡','Personal OS','Sistema operativo personale tipo Notion AI',
`Crea un Personal Productivity OS con:
- Gestione task con priorità e deadline
- Note Markdown con linking bidirezionale
- Daily planner con time blocking
- Goals tracking con milestones
- Habit tracker con streak
- Journal con AI reflection
- Dashboard produttività settimanale
Stack: Next.js, PostgreSQL, Anthropic, Tailwind`,'productivity,tasks,notes,personal'),

T('p002','productivity','⚡','Meeting Manager','Gestione meeting dal pre al post',
`Crea un Meeting Manager con:
- Agenda builder collaborativa pre-meeting
- Timer per agenda items durante meeting
- Note condivise in real-time
- Trascrizione automatica (Whisper)
- Action items AI-extracted
- Assignment task ai partecipanti
- Follow-up email automatica
Stack: Next.js, WebSocket, OpenAI Whisper, Anthropic`,'productivity,meetings,collaboration,ai'),

T('p003','productivity','⚡','Knowledge Management','Second brain tipo Obsidian cloud',
`Crea un Knowledge Management System con:
- Editor markdown con wiki links [[]]
- Graph view connessioni note
- Tag system gerarchico
- Full-text search
- Daily notes automatiche
- Template note personalizzabili
- Export Obsidian/Notion compatible
- AI: link suggestions, auto-summary
Stack: Next.js, PostgreSQL, Anthropic, D3.js`,'productivity,knowledge,notes,wiki'),

// ─── SOCIAL MEDIA ─────────────────────────────────────────────────────────────
T('sm001','social','📱','Instagram Automation','Automatizza crescita profilo Instagram',
`Crea un Instagram Growth Automation con:
- Content calendar con scheduler
- Caption AI generator con hashtag research
- Story creator con template
- Risposta automatica DM e commenti
- Analisi competitor e hashtag
- Report crescita settimanale
- Collaborazione team
Stack: Python, instagram-graph-api, anthropic, celery`,'social,instagram,automation,growth'),

T('sm002','social','📱','Twitter/X Thread Scheduler','Crea e schedula thread virali automaticamente',
`Crea un Twitter Thread Creator & Scheduler con:
- AI per generare thread virali da topic
- Editor thread con preview
- Scheduling multi-account
- Analytics: impression, engagement, follower growth
- Thread template library
- Repost automation dei thread top
- A/B test hook
Stack: Next.js, Twitter API v2, Anthropic, PostgreSQL`,'social,twitter,threads,scheduling'),

T('sm003','social','📱','LinkedIn Outreach Automation','Sistema outreach LinkedIn professionale',
`Crea un LinkedIn Outreach System con:
- Sales Navigator integration
- Messaggi personalizzati con AI
- Multi-step sequences
- Auto accept connection (safe mode)
- Response tracking e follow-up
- CRM integration
- Analytics: acceptance rate, reply rate, meeting booked
Stack: Python, linkedin-api, anthropic, postgresql`,'social,linkedin,outreach,sales'),

// ─── EDUCATION ────────────────────────────────────────────────────────────────
T('edu001','education','🎓','Online Course Platform','Piattaforma corsi online tipo Teachable',
`Crea una Course Platform completa con:
- Upload video, PDF, quiz, assignment
- Course builder drag&drop
- Student progress tracking
- Certificate automatico al completamento
- Community forum per studenti
- Live session (Zoom integration)
- Pagamenti Stripe + affiliate
Stack: Next.js, PostgreSQL, S3, Stripe, Vimeo API`,'education,courses,elearning,platform'),

T('edu002','education','🎓','Quiz & Assessment Builder','Builder quiz con analytics dettagliate',
`Crea un Quiz Builder professionale con:
- Tipi domanda: MC, vero/falso, risposta aperta, matching
- Randomizzazione domande e risposte
- Timer e tentativi limitati
- Correzione AI per risposte aperte
- Analytics: score distribution, domande difficili
- Certificate generator
- LMS integration (SCORM)
Stack: React, Node.js, PostgreSQL, Anthropic`,'education,quiz,assessment,analytics'),

// ─── BLOCKCHAIN ───────────────────────────────────────────────────────────────
T('bc001','blockchain','🔗','NFT Minting Platform','Piattaforma mint NFT con marketplace',
`Crea una NFT Platform con:
- Wallet connect (MetaMask, WalletConnect)
- Upload artwork + metadata IPFS
- Smart contract ERC-721/ERC-1155 (Hardhat)
- Lazy minting per gas optimization
- Marketplace buy/sell/auction
- Royalties automatiche
- Dashboard creator analytics
Stack: Next.js, Ethers.js, Hardhat, IPFS, OpenZeppelin`,'blockchain,nft,web3,ethereum'),

T('bc002','blockchain','🔗','DeFi Dashboard','Dashboard DeFi portfolio multi-chain',
`Crea un DeFi Portfolio Dashboard con:
- Multi-chain: Ethereum, BSC, Polygon, Solana, Avalanche
- Tracking posizioni: LP, staking, lending, borrowing
- APY aggregator (1inch, DeFiLlama)
- Impermanent loss calculator
- Tax report DeFi
- Alert price e liquidation
- Portfolio rebalancing
Stack: Next.js, Ethers.js, Web3.js, DeFiLlama API`,'blockchain,defi,portfolio,web3'),

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
T('an001','analytics','📈','Customer Analytics Platform','Analisi comportamento utenti 360°',
`Crea una Customer Analytics Platform con:
- Event tracking con JavaScript SDK
- User journey visualization
- Cohort analysis e retention
- Funnel analysis con drop-off
- RFM segmentation (Recency, Frequency, Monetary)
- Predictive churn score
- AI insights automatici
Stack: React, ClickHouse, Node.js, Python/sklearn`,'analytics,customers,behavior,ml'),

T('an002','analytics','📈','Revenue Analytics','Dashboard revenue con forecasting AI',
`Crea un Revenue Analytics Dashboard con:
- MRR, ARR, churn rate, expansion revenue
- Cohort revenue analysis
- Forecasting 12 mesi con ML
- Segmentazione per piano/paese/industria
- Unit economics (LTV, CAC, payback)
- Alert anomalie revenue
- Export per board/investitori
Stack: React, PostgreSQL, Python/Prophet, FastAPI`,'analytics,revenue,forecasting,saas'),

// ─── SCRAPING ─────────────────────────────────────────────────────────────────
T('sc001','scraping','🕷️','Price Scraper','Monitora prezzi da qualsiasi sito',
`Crea un Price Monitoring Scraper con:
- Spider per siti e-commerce con Playwright
- Parsing prezzi con AI (gestisce layout diversi)
- Database storico prezzi
- Alert via email/Telegram per variazioni
- Dashboard comparazione prezzi
- Export CSV/Excel
- Proxy rotation per anti-ban
Stack: Python, Playwright, FastAPI, PostgreSQL, Redis`,'scraping,prices,monitoring,ecommerce'),

T('sc002','scraping','🕷️','Job Board Aggregator','Aggrega offerte lavoro da tutti i siti',
`Crea un Job Aggregator con:
- Scraping Indeed, LinkedIn, Glassdoor, InfoJobs, Monster
- Deduplication intelligente con AI
- Filtri: ruolo, città, stipendio, remote, azienda
- Alert email per new matching jobs
- Applicazione one-click
- Tracking application status
Stack: Python, Scrapy/Playwright, Elasticsearch, FastAPI, React`,'scraping,jobs,aggregator,search'),

T('sc003','scraping','🕷️','Competitor Intelligence','Monitora competitor automaticamente',
`Crea un Competitor Intelligence System che monitora:
- Prezzi e variazioni
- Nuovi prodotti/servizi
- Offerte e promozioni
- Review e sentiment
- Social media presence
- Ad spend estimate
- Hiring (indica direzione strategica)
Report settimanale automatico
Stack: Python, Playwright, Anthropic, PostgreSQL`,'scraping,competitive-intel,monitoring,strategy'),

// ─── LEGAL ────────────────────────────────────────────────────────────────────
T('leg001','legal','⚖️','Contract Generator','Genera contratti legali personalizzati',
`Crea un Contract Generator con:
- 50+ template contratti (NDA, consulenza, fornitura, impiego, locazione...)
- Wizard guidato per personalizzazione
- Clausole aggiuntive con AI
- Review AI per rischi
- Firma digitale integrata (DocuSign/SignNow)
- Tracking status firma
- Archiviazione sicura
Stack: Next.js, DocuSign API, Anthropic, PostgreSQL, S3`,'legal,contracts,documents,signature'),

T('leg002','legal','⚖️','GDPR Compliance Toolkit','Strumenti per conformità GDPR',
`Crea un GDPR Compliance Toolkit con:
- Cookie consent banner configurabile
- Privacy policy generator
- Data processing register (ROPA)
- Data breach response workflow
- Subject access request management
- Vendor DPA management
- Audit trail compliance
Stack: Next.js, PostgreSQL, SendGrid`,'legal,gdpr,privacy,compliance'),

// ─── HEALTH ───────────────────────────────────────────────────────────────────
T('h001','health','🏥','Telemedicine Platform','Piattaforma telemedicina completa',
`Crea una Telemedicine Platform con:
- Prenotazione visita online
- Videoconsulto sicuro (WebRTC)
- Cartella clinica digitale
- Prescrizioni digitali
- Fatturazione e rimborso assicurazione
- Reminder appuntamenti
- Dashboard medico con agenda
Stack: Next.js, WebRTC, PostgreSQL, Stripe, FHIR API`,'health,telemedicine,medical,platform'),

T('h002','health','🏥','Wellness Tracking App','App wellness personalizzata con AI coach',
`Crea una Wellness App con:
- Tracking: sonno, attività, alimentazione, stress, umore
- Integration wearable (Apple Health, Fitbit, Garmin)
- AI coach personalizzato per obiettivi
- Piani workout generati da AI
- Meal planning con calorie e macros
- Progress visualization
- Community challenge
Stack: React Native/Next.js, HealthKit API, Anthropic`,'health,wellness,fitness,ai-coach'),

// ─── CONTENT ──────────────────────────────────────────────────────────────────
T('co001','content','✍️','Blog AI Factory','Genera blog post SEO in automatico',
`Crea un Blog Content Factory con:
- Ricerca keyword e competitor analysis
- Outline AI con heading structure ottimale
- Generazione articolo 2000+ parole
- Ottimizzazione SEO on-page
- Generazione immagini DALL-E per copertina
- Pubblicazione automatica WordPress/Ghost
- Scheduling programmato
Stack: Python, Anthropic, WordPress API, DALL-E, Semrush`,'content,blog,seo,automation'),

T('co002','content','✍️','YouTube Script Generator','Script video YouTube ottimizzati per retention',
`Crea un YouTube Script Generator con:
- Analisi topic trend (YouTube API)
- Hook generator (first 15 secondi)
- Script completo con pacing e visual cues
- Pattern retention (open loops, payoff)
- CTA e subscribe prompts
- Thumbnail concept generator
- Video description + tags ottimizzati
Stack: Next.js, Anthropic, YouTube API, DALL-E`,'content,youtube,video,scripts'),

T('co003','content','✍️','Podcast Production System','Automatizza produzione e distribuzione podcast',
`Crea un Podcast Production System con:
- Trascrizione automatica Whisper
- Editing AI: rimuovi silenzio, filler words
- Show notes AI-generated
- Clip automatici per social (16:9, 9:16, 1:1)
- Distribuzione automatica (Spotify, Apple, Google)
- Newsletter episodio automatica
- Analytics aggregati
Stack: Python, OpenAI Whisper, Anthropic, AWS S3, FFMPEG`,'content,podcast,audio,distribution'),

// ─── EMAIL MARKETING ─────────────────────────────────────────────────────────
T('em001','email','📧','Drip Campaign Builder','Builder sequenze email automatizzate',
`Crea un Drip Campaign Builder con:
- Visual workflow editor
- Trigger: signup, acquisto, inattività, milestone
- Personalization con merge tags e AI
- A/B test ogni email
- Analytics per email e sequenza
- Unsubscribe gestione automatica
- Template library 50+ email
Stack: Node.js, BullMQ, SendGrid, PostgreSQL, React`,'email,drip,automation,marketing'),

T('em002','email','📧','Newsletter Platform','Piattaforma newsletter tipo Substack',
`Crea una Newsletter Platform con:
- Editor email WYSIWYG
- Gestione subscriber con tag
- Free + paid subscription (Stripe)
- Archivio web pubblico
- SEO per ogni numero
- Analytics dettagliato
- RSS e embed widget
Stack: Next.js, PostgreSQL, Stripe, SendGrid, Tiptap`,'email,newsletter,subscription,content'),

// Add more to reach 500+...

// ─── EXTRA: Property Management specifics ─────────────────────────────────────
T('pm001','realestate','🏠','Affitti Brevi Manager','Gestione Airbnb/Booking.com centralizzata',
`Crea un sistema per gestire affitti brevi con:
- Sincronizzazione calendari Airbnb, Booking.com, VRBO (iCal)
- Gestione prezzi dinamici per stagionalità
- Comunicazione automatica con ospiti
- Check-in digitale con keyless entry
- Pulizie: scheduling automatico team
- Manutenzione: ticket e tracciamento
- Revenue report mensile per ogni proprietà
Stack: Next.js, PostgreSQL, iCal, Stripe, SendGrid`,'realestate,airbnb,rental,management'),

T('pm002','realestate','🏠','Tenant Portal','Portale inquilini self-service',
`Crea un Tenant Self-Service Portal con:
- Pagamento affitto online (Stripe, bonifico)
- Ricevute e storico pagamenti
- Invio richieste manutenzione con foto
- Chat con proprietario/gestore
- Documenti (contratto, ricevute, certificati)
- Notifiche scadenze (contratto, rinnovi)
Stack: Next.js, PostgreSQL, Stripe, Socket.io`,'realestate,tenant,portal,self-service'),

T('pm003','realestate','🏠','Property Deal Analyzer','Analisi ROI investimento immobiliare',
`Crea un Real Estate Deal Analyzer con:
- Input: prezzo acquisto, spese, canone affitto
- Calcolo: ROI, cap rate, cash-on-cash, GRM
- Simulazioni: mutuo, tassazione, manutenzione
- Break-even analysis
- Confronto deal multipli
- Report PDF per banca/investitori
- Database deal salvati
Stack: Next.js, PostgreSQL, pdfmake, Recharts`,'realestate,investment,analysis,roi'),

// ─── MONETIZATION ────────────────────────────────────────────────────────────
T('mon001','saas','🚀','Affiliate System','Sistema affiliazione completo',
`Crea un Affiliate Marketing System con:
- Registrazione affiliate con approval
- Dashboard affiliate: click, conversioni, commissioni
- Link tracking con UTM e cookie
- Multi-tier commissions (10-25%)
- Payout automatico (PayPal/Stripe)
- Materiali marketing (banner, copy, video)
- Fraud detection
Stack: Next.js, PostgreSQL, Stripe, Redis`,'affiliate,marketing,monetization,tracking'),

T('mon002','saas','🚀','Usage-Based Billing','Billing per consumo tipo AWS/Stripe Metered',
`Crea un Usage-Based Billing System con:
- Metering chiamate API, storage, utenti, seats
- Aggregazione usage real-time
- Billing automatico fine periodo
- Dashboard usage per customer
- Alert pre-cap (80%, 100%)
- Credit system con top-up
- Webhook Stripe per eventi
Stack: Node.js, Stripe Metered Billing, Redis, TimescaleDB`,'billing,usage,metered,saas'),

T('mon003','saas','🚀','Pricing Page Optimizer','A/B test prezzi per massimizzare conversioni',
`Crea un Pricing Page Optimizer con:
- A/B test multi-variante prezzi e piani
- Heatmap e session recording
- Funnel analysis: visualizza → signup → upgrade
- Winnerdetection statistica (chi vince)
- Personalizzazione per segmento
- Revenue impact calculator
- Report settimanale con raccomandazioni
Stack: Next.js, PostgreSQL, Anthropic, Vercel Analytics`,'pricing,conversion,ab-testing,revenue'),

// ─── FUNNEL & MARKETING ───────────────────────────────────────────────────────
T('mkt001','marketing','📣','Funnel Lead Magnet completo','Funnel gratuito → lead → nurturing → vendita',
`Crea un Lead Magnet Funnel completo:
- Landing page opt-in con copywriting persuasivo
- Lead magnet (ebook PDF auto-generato)
- Thank you page con offerta tripwire €27-47
- Sequenza email 7 giorni nurturing
- Upsell core offer €297-497
- Backend email per non acquirenti
- Analytics: CPL, ROAS, LTV
Stack: Next.js, Resend, Stripe, Redis`,'funnel,lead-magnet,email,marketing'),

T('mkt002','marketing','📣','Webinar Funnel automatizzato','Sistema webinar evergreen con AI',
`Crea un Webinar Funnel Evergreen:
- Pagina registrazione ottimizzata
- Email sequenza pre-webinar (3 reminder)
- Replay page con CTA urgenza
- Pitch deck generator AI
- Follow-up sequenza 10 email
- Replay scaler: riedita con AI per nuove nicchie
- Dashboard: registrazioni, show-up rate, conversioni
Stack: Next.js, Anthropic, Resend, YouTube API`,'webinar,funnel,automation,evergreen'),

T('mkt003','marketing','📣','Sistema Referral Virale','Programma referral stile Dropbox/Airbnb',
`Crea un sistema Referral Marketing:
- Dashboard per affiliati con link unico
- Tracking click, signup, conversioni
- Commissioni automatiche via Stripe Connect
- Email automatiche milestone
- Leaderboard gamificata
- Tier system (bronze/silver/gold/diamond)
- Payout automatico mensile
Stack: Next.js, Stripe Connect, Redis, Resend`,'referral,affiliate,viral,growth'),

T('mkt004','marketing','📣','Content Calendar AI','Piano editoriale multi-canale 90 giorni',
`Crea un Content Calendar AI-powered:
- Genera 90 giorni di contenuti per canale
- Blog, LinkedIn, Instagram, TikTok, Email
- Keyword research integrato (SEMrush/Ahrefs API)
- SEO optimization automatica
- Scheduling automatico (Buffer/Hootsuite API)
- Performance tracking per singolo post
- Riciclo automatico best performer
Stack: Next.js, Anthropic, Buffer API, Google Search Console`,'content,calendar,seo,social'),

T('mkt005','marketing','📣','Email Warm-Up System','Scalda email per max deliverability',
`Crea un Email Warm-Up System:
- Warm-up automatico inbox nuova
- Invio graduale (10→50→200→1000/gg)
- Interazioni reali con network warm-up
- Spam score monitor (SpamAssassin)
- DKIM/SPF/DMARC checker
- Deliverability dashboard
- Alert quando spam rate >0.1%
Stack: Node.js, SendGrid/SES, Redis, Puppeteer`,'email,deliverability,warmup,spam'),

// ─── SEO TOOLS ────────────────────────────────────────────────────────────────
T('seo001','seo','🔍','SEO Audit Tool completo','Analisi tecnica SEO on-page e off-page',
`Crea un SEO Audit Tool:
- Crawl sito (Sitemap, robots.txt, canonical)
- Core Web Vitals (LCP, FID, CLS) via Google API
- On-page: title, meta, headings, alt text
- Off-page: backlink analysis (Ahrefs/Moz API)
- Competitor gap analysis
- Keyword cannibalization detector
- Report PDF automatico con priorità fix
Stack: Next.js, Puppeteer, Google Search Console API, Ahrefs`,'seo,audit,technical,performance'),

T('seo002','seo','🔍','Keyword Research AI','Trova keyword con alto intento e bassa difficoltà',
`Crea un Keyword Research Tool AI-powered:
- Seed keyword → 500+ keyword correlate
- Intento ricerca classificato (info/nav/trans/comm)
- Difficulty score e volume mensile
- SERP analysis top 10 per keyword
- Topic cluster builder automatico
- Content brief generator per ogni keyword
- Gap analysis vs competitor
Stack: Python, Google Keyword Planner API, Anthropic, pandas`,'keyword,research,seo,content'),

T('seo003','seo','🔍','Link Building Outreach','Sistema automatico acquisizione backlink',
`Crea un Link Building Outreach System:
- Scraper siti rilevanti per nicchia
- Email personalizata via AI per ogni sito
- Sequenza follow-up automatica (3 email)
- CRM integrato per tracciare conversazioni
- Domain Authority filter (DA>30)
- Anchor text optimizer
- Report mensile backlink acquisiti
Stack: Python, Anthropic, SendGrid, Redis, Ahrefs API`,'linkbuilding,seo,outreach,backlinks'),

T('seo004','seo','🔍','Articoli SEO bulk generator','Genera 50+ articoli ottimizzati al giorno',
`Crea un Bulk SEO Content Generator:
- Input: lista keyword → output: articoli completi
- Ricerca SERP per ogni keyword
- Outline automatico da competitor top 3
- Articolo 1500-3000 parole completamente ottimizzato
- Immagini AI-generate (DALL-E/Stable Diffusion)
- Auto-publish su WordPress/Ghost
- Monitoraggio ranking post-pubblicazione
Stack: Python, Anthropic, DALL-E API, WordPress API`,'seo,content,bulk,automation'),

// ─── SOCIAL MEDIA ─────────────────────────────────────────────────────────────
T('soc001','social','📱','Instagram Growth Bot','Crescita organica Instagram con AI',
`Crea un Instagram Growth System:
- Analisi competitor e hashtag vincenti
- Generazione caption AI con call to action
- Scheduler automatico migliori orari
- Story generator con template
- Commenti intelligenti per engagement
- Analisi metriche: reach, saves, profile visits
- DM automatici ai nuovi follower
Stack: Python, Instagrapi, Anthropic, Redis`,'instagram,social,growth,automation'),

T('soc002','social','📱','LinkedIn Content Machine','Diventa thought leader su LinkedIn',
`Crea un LinkedIn Content Machine:
- Post generator da URL/idea/keyword
- Carosello PDF auto-generato
- Commenti strategici su post virali
- Connection request personalizzata AI
- Analytics: impressioni, engagement rate
- A/B test tono comunicazione
- Lead extraction da engagement
Stack: Python, LinkedIn API, Anthropic, Selenium`,'linkedin,b2b,social,leads'),

T('soc003','social','📱','TikTok Script Generator','Script virali per TikTok e Reels',
`Crea un TikTok/Reels Script Generator:
- Trend analysis (TikTok API + web scraping)
- Script hook-corpo-CTA strutturato
- Hook ottimizzato per primi 3 secondi
- Hashtag research trending
- Caption ottimizzata
- Timing suggerito per pubblicazione
- Performance predictor AI
Stack: Python, Anthropic, TikTok API, Redis`,'tiktok,video,reels,viral'),

T('soc004','social','📱','Social Media Dashboard','Dashboard unificata tutti i social',
`Crea una Social Media Dashboard:
- Connetti Instagram, LinkedIn, Twitter/X, Facebook
- Metriche unificate: follower, reach, engagement
- Best time to post per ogni piattaforma
- Competitor tracker
- Sentiment analysis commenti
- Report PDF settimanale automatico
- Alert per spike/drop engagement
Stack: Next.js, Meta API, LinkedIn API, Twitter API`,'social,dashboard,analytics,reporting'),

// ─── HR & RECRUITING ──────────────────────────────────────────────────────────
T('hr001','hr','👔','ATS - Applicant Tracking System','Sistema completo gestione candidature',
`Crea un ATS (Applicant Tracking System):
- Job posting multi-piattaforma (LinkedIn, Indeed, JobRapido)
- Pipeline candidati (new → screen → interview → offer)
- AI scoring CV vs job description
- Email automatiche per ogni stage
- Calendar integration (Google Calendar)
- Video interview scheduling
- Feedback strutturato per team
Stack: Next.js, Anthropic, Google Calendar API, SendGrid`,'ats,recruiting,hr,hiring'),

T('hr002','hr','👔','CV Analyzer & Job Matcher','Analisi CV e matching lavori automatico',
`Crea un CV Analyzer intelligente:
- Parse CV (PDF/Word) con AI
- Estrai: skills, esperienza, education, progetti
- Match con database offerte lavoro
- Score compatibilità 0-100 per ogni offerta
- Gap analysis: cosa manca per ogni ruolo
- Suggerimenti miglioramento CV
- Export report per candidato
Stack: Python, Anthropic, pdf-parse, Redis`,'cv,recruiting,hr,matching'),

T('hr003','hr','👔','Employee Onboarding System','Onboarding automatizzato nuovi dipendenti',
`Crea un Onboarding System:
- Checklist personalizzata per ruolo
- Welcome email sequence automatizzata
- Quiz knowledge check
- Document signing (DocuSign API)
- Progress tracking manager
- Buddy system pairing
- 30-60-90 day milestone tracker
Stack: Next.js, DocuSign API, SendGrid, Redis`,'onboarding,hr,employee,automation'),

// ─── LEGAL & CONTRACTS ────────────────────────────────────────────────────────
T('leg001','legal','⚖️','Contract Generator completo','Genera 20+ tipi di contratto legali',
`Crea un Contract Generator professionale:
- 20+ template: NDA, freelance, SaaS, partnership, agenzia
- Personalizzazione via form guidato
- Clausole AI-ottimizzate per legge italiana
- Export PDF/Word firmabile
- Versioning e tracking modifiche
- Firma digitale (DocuSign/HelloSign)
- Archivio contratti con scadenze
Stack: Next.js, Anthropic, pdf-lib, DocuSign API`,'legal,contracts,documents,italian'),

T('leg002','legal','⚖️','Privacy Policy Generator','GDPR-compliant privacy policy automatica',
`Crea un Privacy Policy & GDPR Generator:
- Questionario guidato sul trattamento dati
- Privacy policy completa GDPR-compliant
- Cookie policy con cookie banner
- DPA (Data Processing Agreement)
- Registro trattamenti (Art. 30 GDPR)
- Alert scadenze e aggiornamenti normativi
- Export in italiano e inglese
Stack: Next.js, Anthropic, pdf-lib`,'privacy,gdpr,legal,compliance'),

// ─── EDUCATION ────────────────────────────────────────────────────────────────
T('edu001','education','🎓','LMS - Learning Management System','Piattaforma corsi online completa',
`Crea un LMS completo:
- Upload corsi video (Vimeo/Bunny.net)
- Drip content (sblocco progressivo)
- Quiz e certificati auto-generati
- Community integrata (forum/commenti)
- Progress tracking studenti
- Stripe per pagamento corsi
- Affiliate program integrato
Stack: Next.js, Bunny.net, Stripe, Redis, Anthropic`,'lms,course,education,elearning'),

T('edu002','education','🎓','Quiz Generator AI','Genera quiz da qualsiasi testo/PDF',
`Crea un Quiz Generator AI-powered:
- Input: testo, PDF, URL → output: quiz completo
- Domande multiple, vero/falso, aperte
- Difficoltà adattiva (Bloom's Taxonomy)
- Randomizzazione domande e risposte
- Timer e scoring automatico
- Report performance per studente
- Export SCORM per LMS
Stack: Next.js, Anthropic, pdf-parse, Redis`,'quiz,education,ai,testing'),

T('edu003','education','🎓','AI Tutor personale','Tutor AI adattivo per ogni materia',
`Crea un AI Personal Tutor:
- Analizza livello studente con diagnostic test
- Piano di studio personalizzato
- Spiegazioni adattive al livello
- Esercizi progressivi generati AI
- Feedback immediato con suggerimenti
- Gamification (punti, badge, streak)
- Report settimanale per genitori/docenti
Stack: Next.js, Anthropic, Redis, gamification system`,'tutor,education,ai,personalized'),

// ─── REAL ESTATE ──────────────────────────────────────────────────────────────
T('re001','realestate','🏠','Portale Immobiliare completo','Sito annunci immobiliari con AI',
`Crea un Portale Immobiliare:
- Listing con gallerie foto, mappe, virtual tour
- Ricerca avanzata (zona, prezzo, mq, locali)
- AI valutazione immobile (AVM)
- Descrizione AI da caratteristiche
- Mortgage calculator integrato
- Lead capture automatico
- CRM agenti integrato
Stack: Next.js, Google Maps API, Anthropic, Stripe`,'realestate,property,portal,ai'),

T('re002','realestate','🏠','Property Valuation AI','Stima valore immobili con AI',
`Crea un Property Valuation Tool:
- Input: indirizzo, mq, locali, piano, stato
- Analisi comparativa immobili venduti (OMI data)
- Range valutazione con confidenza
- Trend prezzi zona ultimi 5 anni
- Report PDF professionale
- Integration con portali (Immobiliare.it, Casa.it)
- Alert prezzi zona configurabili
Stack: Next.js, Anthropic, OMI API, Redis`,'valuation,realestate,ai,property'),

// ─── BLOCKCHAIN ───────────────────────────────────────────────────────────────
T('blk001','blockchain','🔗','NFT Collection Generator','Genera e deploya collezione NFT completa',
`Crea un NFT Collection Generator:
- Generazione artwork procedurale (tratti/layer)
- Metadata IPFS upload automatico
- Smart contract ERC-721 ottimizzato
- Minting website con wallet connect
- Reveal mechanism
- Royalties automatiche
- Discord bot per holder
Stack: Solidity, Hardhat, React, IPFS/Pinata, OpenSea`,'nft,blockchain,web3,ethereum'),

T('blk002','blockchain','🔗','DeFi Dashboard','Portfolio DeFi tracker unificato',
`Crea un DeFi Portfolio Dashboard:
- Connetti wallet (MetaMask, WalletConnect)
- Tracking: LP positions, yield farming, staking
- Impermanent loss calculator
- Gas tracker Ethereum/Polygon
- Alert price token configurabili
- P&L tracking con storico
- Tax report CSV (per commercialista)
Stack: React, ethers.js, Moralis/Alchemy, Redis`,'defi,blockchain,portfolio,crypto'),

// ─── PRODUCTIVITY ─────────────────────────────────────────────────────────────
T('prod001','productivity','⚡','Personal AI Assistant','Assistente personale AI autonomo',
`Crea un Personal AI Assistant:
- Task management con AI prioritization
- Email summarizer e risposta automatica
- Meeting notes AI (Whisper transcription)
- Research agent su richiesta
- Daily briefing automatico (7:00)
- Reminder intelligenti basati su contesto
- Knowledge base personale (RAG)
Stack: Next.js, Anthropic, Whisper API, Resend, Redis`,'productivity,assistant,ai,automation'),

T('prod002','productivity','⚡','Automation Hub','Centro automazioni no-code/low-code',
`Crea un Automation Hub:
- Trigger: webhook, cron, form, email
- Actions: HTTP request, email, database, AI
- Visual workflow builder
- Pre-built template (100+)
- Error handling e retry logic
- Versioning workflow
- Monitoring dashboard real-time
Stack: Next.js, Redis, Upstash QStash, Anthropic`,'automation,workflow,nocode,productivity'),

T('prod003','productivity','⚡','Meeting Summarizer AI','Trascrivi e riassumi qualsiasi meeting',
`Crea un Meeting Summarizer:
- Upload audio/video qualsiasi formato
- Transcription multi-lingua (Whisper)
- Speaker diarization (chi parla)
- AI summary: decisioni, azioni, next steps
- Export PDF/Notion/Slack
- Auto-invio riepilogo ai partecipanti
- Integrazione Google Meet/Zoom via bot
Stack: Next.js, Whisper API, Anthropic, Resend`,'meeting,transcription,ai,productivity'),

T('prod004','productivity','⚡','Focus Timer + AI Coach','Pomodoro AI con coaching personalizzato',
`Crea un AI Focus Coach:
- Pomodoro timer configurabile
- Task breakdown AI (divide task grandi)
- Focus score giornaliero
- Distraction logger e analisi
- AI coach motivazionale
- Weekly review automatizzata
- Integration Calendar Google/Outlook
Stack: Next.js, Anthropic, Google Calendar API, Redis`,'focus,pomodoro,productivity,coaching'),

// ─── ECOMMERCE ────────────────────────────────────────────────────────────────
T('ec001','ecommerce','🛒','E-commerce AI complete','Negozio online con AI integrata',
`Crea un E-commerce completo con AI:
- Catalogo prodotti con ricerca semantica
- Raccomandazioni AI personalizzate
- Descrizioni prodotto AI-generate
- Carrello + Stripe checkout
- Gestione ordini e tracking
- Review summarizer AI
- Abandoned cart email automatiche
Stack: Next.js, Stripe, Anthropic, Redis, Upstash`,'ecommerce,shop,ai,stripe'),

T('ec002','ecommerce','🛒','Dropshipping Automation','Automazione completa dropshipping',
`Crea un sistema Dropshipping Automatizzato:
- Scraper prodotti vincenti (AliExpress/CJ)
- Import automatico con markup
- Sync inventario automatico
- Ordini automatici a fornitore
- Tracking spedizioni unificato
- Review importer (AliExpress → Shopify)
- Profit calculator per prodotto
Stack: Python, Shopify API, AliExpress API, Redis`,'dropshipping,ecommerce,automation'),

T('ec003','ecommerce','🛒','Amazon FBA Analyzer','Analisi prodotti Amazon per FBA',
`Crea un Amazon FBA Product Analyzer:
- Ricerca prodotti per keyword/categoria
- BSR tracker storico
- Analisi competitor (top 10 per keyword)
- Profittabilità FBA (FBA fee + COGS + ads)
- Review analysis con AI sentiment
- Demand forecast
- Keyword tracking posizioni
Stack: Python, Amazon SP-API, Keepa API, Anthropic`,'amazon,fba,ecommerce,analysis'),

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
T('an001','analytics','📈','Business Intelligence Dashboard','BI dashboard real-time per PMI',
`Crea una Business Intelligence Dashboard:
- KPI tracking in tempo reale
- Fonti: Stripe, Google Analytics, CRM, DB
- Grafici: revenue, CAC, LTV, churn, MRR
- Anomaly detection AI automatica
- Report settimanale/mensile via email
- Benchmark settore
- Forecasting AI 90 giorni
Stack: Next.js, Chart.js, Stripe API, Google Analytics, Anthropic`,'bi,dashboard,analytics,kpi'),

T('an002','analytics','📈','Heatmap & Session Recording','Analisi comportamento utenti',
`Crea un sistema Heatmap & Session Recording:
- Click heatmap + scroll map
- Session recording player
- Funnel analysis con drop-off
- Form analytics (campo per campo)
- Rage click detector
- A/B test integrato
- GDPR-compliant (no dati personali)
Stack: Next.js, Canvas API, Redis, PostgreSQL`,'heatmap,analytics,ux,conversion'),

// ─── HEALTH & WELLNESS ────────────────────────────────────────────────────────
T('hlt001','health','🏥','Telemedicine Platform','Piattaforma telemedicina completa',
`Crea una piattaforma di Telemedicina:
- Prenotazione visite (calendario dinamico)
- Video consultazione (WebRTC)
- Gestione referti e documentazione
- E-prescription (API farmacia)
- Patient history con AI summary
- Pagamento Stripe + SSN integration
- Notifiche promemoria pazienti
Stack: Next.js, WebRTC, Stripe, Anthropic, Redis`,'health,telemedicine,medical,video'),

T('hlt002','health','🏥','Fitness & Nutrition AI','App fitness con coaching AI personale',
`Crea una Fitness App con AI Coach:
- Onboarding: obiettivi, livello, attrezzatura
- Piano allenamento AI settimanale personalizzato
- Workout tracker con timer e progressioni
- Piano nutrizionale con calorie/macros
- Analisi foto pasti (AI visual recognition)
- Progress tracking con grafici
- Integrazione Apple Health/Google Fit
Stack: Next.js, Anthropic, Vision API, Redis`,'fitness,nutrition,health,ai'),

// ─── FINANCE TOOLS ────────────────────────────────────────────────────────────
T('fin001','finance','💰','Invoice & Accounting System','Gestione fatture e contabilità semplificata',
`Crea un sistema Fatturazione + Contabilità:
- Crea/invia fatture professionali PDF
- Fattura elettronica XML (SDI Italia)
- Prima nota automatica
- P&L mensile/annuale
- Dashboard cashflow
- Promemoria pagamenti automatici
- Export per commercialista (Excel/CSV)
Stack: Next.js, pdf-lib, xml2js, Stripe, Redis`,'invoice,accounting,finance,italian'),

T('fin002','finance','💰','Personal Finance Tracker','Tracker spese personali con AI',
`Crea un Personal Finance Tracker:
- Import automatico estratti conto (PDF/CSV)
- Categorizzazione spese AI
- Budget mensile con alert
- Trend spese per categoria
- Obiettivi risparmio con progress
- Simulatore investimenti
- Report mensile AI con consigli
Stack: Next.js, Anthropic, pdf-parse, Chart.js, Redis`,'finance,budget,personal,tracking'),

T('fin003','finance','💰','Trading Bot Paper Trading','Bot trading con backtesting',
`Crea un Trading Bot con Paper Trading:
- Strategy builder visuale (MA, RSI, MACD, ecc.)
- Backtesting su dati storici (Yahoo Finance)
- Paper trading simulato real-time
- Performance metrics (Sharpe, drawdown, win rate)
- Portfolio diversification analyzer
- Risk management (stop-loss, position sizing)
- Alert telegram per segnali
Stack: Python, yfinance, pandas, Redis, Telegram Bot`,'trading,finance,bot,backtesting'),

// ─── CUSTOMER SERVICE ─────────────────────────────────────────────────────────
T('cs001','chatbot','💬','AI Customer Service Agent','Agente supporto clienti autonomo',
`Crea un AI Customer Service Agent:
- Knowledge base personalizzabile (PDF/URL)
- Risposta automatica 80% domande
- Escalation umana per casi complessi
- Multi-canale: web, email, WhatsApp
- Sentiment analysis real-time
- CSAT survey automatica post-risoluzione
- Dashboard: ticket, tempo risoluzione, CSAT
Stack: Next.js, Anthropic, LangChain, Twilio, Redis`,'chatbot,support,customer,ai'),

T('cs002','chatbot','💬','WhatsApp Business Bot','Bot WhatsApp per vendita e supporto',
`Crea un WhatsApp Business Bot:
- Menu interattivo (prodotti, prezzi, ordini)
- Risposta AI a domande libere
- Catalogo prodotti con immagini
- Checkout guidato + pagamento link
- Tracking ordine automatico
- Appointment booking
- Broadcast message con segmentazione
Stack: Node.js, WhatsApp Business API, Anthropic, Stripe`,'whatsapp,bot,business,messaging'),

// ─── API & BACKEND ─────────────────────────────────────────────────────────────
T('api001','api','🔌','REST API boilerplate enterprise','API Node.js production-ready',
`Crea un REST API Enterprise boilerplate:
- Auth JWT + refresh token rotation
- Rate limiting (Redis)
- Request validation (Zod)
- Pagination, filtering, sorting
- Swagger/OpenAPI docs auto-generate
- Soft delete pattern
- Audit log per ogni azione
- Docker + docker-compose
Stack: Node.js, Express/Fastify, Zod, Redis, PostgreSQL, Docker`,'api,backend,rest,nodejs'),

T('api002','api','🔌','GraphQL API con subscriptions','API GraphQL real-time',
`Crea una GraphQL API completa:
- Schema-first con code generation
- Mutations, Queries, Subscriptions (WebSocket)
- DataLoader per N+1 problem
- Auth con directives (@auth, @admin)
- File upload (multipart)
- Cursor-based pagination
- Persisted queries per performance
Stack: Node.js, Apollo Server, Prisma, PostgreSQL, Redis`,'graphql,api,subscriptions,backend'),

T('api003','api','🔌','Microservices con message queue','Architettura microservizi event-driven',
`Crea un sistema Microservices:
- 4 servizi: user, product, order, notification
- Message broker (RabbitMQ/Redis Streams)
- Service discovery (Consul)
- API Gateway con routing
- Circuit breaker pattern
- Distributed tracing (OpenTelemetry)
- Kubernetes manifests
Stack: Node.js, Docker, Kubernetes, RabbitMQ, Redis, PostgreSQL`,'microservices,api,kubernetes,event-driven'),

// ─── RAG & AI SYSTEMS ─────────────────────────────────────────────────────────
T('rag001','rag','🧠','RAG System con Pinecone','Sistema RAG production-ready',
`Crea un RAG System completo:
- Document ingestion: PDF, Word, URL, TXT
- Chunking intelligente con overlap
- Embedding con text-embedding-3-small
- Vector store Pinecone con metadata
- Retrieval: semantic + keyword hybrid
- Reranking con cross-encoder
- Response con citazioni fonte
Stack: Python, Anthropic, Pinecone, FastAPI, Redis`,'rag,ai,vector,embeddings'),

T('rag002','rag','🧠','AI Knowledge Base aziendale','Base conoscenza AI per aziende',
`Crea una Knowledge Base AI aziendale:
- Upload policy, manuali, FAQ, procedure
- Ricerca semantica multilingua
- Permessi per dipartimento
- Versioning documenti
- Auto-aggiornamento da Google Drive/Notion
- Analytics: query più frequenti, gap
- Integrazione Slack/Teams
Stack: Next.js, Anthropic, Pinecone, Google Drive API, Redis`,'knowledge-base,rag,enterprise,ai'),

T('rag003','rag','🧠','Personal AI Brain','Secondo cervello AI personale',
`Crea un Personal AI Brain:
- Capture note, link, PDF, audio, immagini
- Auto-tagging e categorizzazione AI
- Rete di connessioni semantiche tra note
- Ricerca naturale: "cosa so su X?"
- Daily review automatizzata
- Export in Obsidian/Notion format
- Mobile app PWA con share extension
Stack: Next.js, Anthropic, Pinecone, Vercel Blob, Redis`,'brain,notes,rag,personal'),

// ─── WEB SCRAPING ─────────────────────────────────────────────────────────────
T('sc001','scraping','🕷️','Price Monitor multi-sito','Monitor prezzi e-commerce automatico',
`Crea un Price Monitor:
- Monitora prezzi su Amazon, Zalando, ecc.
- Alert email/Telegram per drop prezzo
- Storico prezzi con grafico
- Competitor price tracking
- Best time to buy predictor AI
- Export CSV per analisi
- Browser extension per aggiungere prodotti
Stack: Node.js, Puppeteer/Playwright, Redis, Resend, Telegram`,'scraping,price,monitoring,ecommerce'),

T('sc002','scraping','🕷️','Lead Scraper B2B','Scraper lead da LinkedIn e Google Maps',
`Crea un B2B Lead Scraper:
- Google Maps: scrapa aziende per categoria+zona
- LinkedIn: trova decision maker
- Email finder (Hunter.io API)
- Enrichment automatico (sito, social, team)
- Deduplication
- Export CSV/Excel per outreach
- GDPR-compliant con opt-out
Stack: Python, Playwright, Redis, Hunter.io API`,'leads,scraping,b2b,linkedin'),

T('sc003','scraping','🕷️','News Aggregator AI','Aggrega e riassume notizie per settore',
`Crea un News Aggregator AI:
- Feed RSS + scraping 100+ siti news
- Categorizzazione automatica AI
- Deduplication notizie simili
- Sintesi in 3 bullet AI
- Newsletter daily automatica
- API pubblica per integrazioni
- Dashboard trending topics
Stack: Node.js, RSS parser, Anthropic, Resend, Redis`,'news,aggregator,ai,newsletter'),

// ─── CRM TOOLS ────────────────────────────────────────────────────────────────
T('crm001','crm','👥','CRM sales completo','CRM per piccoli team di vendita',
`Crea un CRM Sales:
- Pipeline kanban: prospect → qualificato → proposta → won/lost
- Contact management con timeline attività
- Email integrata (Resend) con tracking aperture
- Task e reminder automatici
- Lead scoring AI
- Forecast revenue mensile
- Report: win rate, ciclo vendita, revenue per rep
Stack: Next.js, Anthropic, Resend, Redis, Stripe`,'crm,sales,pipeline,b2b'),

T('crm002','crm','👥','Customer Churn Predictor','Predici quali clienti stanno per andarsene',
`Crea un Churn Prediction System:
- Raccogli segnali: usage drop, ticket, NPS basso
- Model ML per score rischio churn
- Dashboard clienti a rischio (alto/medio/basso)
- Playbook azioni automatiche per tier
- Email salvataggio personalizzata AI
- A/B test offerte retention
- ROI retention tracking
Stack: Python, scikit-learn, Anthropic, Redis, Resend`,'churn,crm,ml,retention'),

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
T('dash001','dashboard','📊','SaaS Metrics Dashboard','Dashboard metriche SaaS (MRR, Churn, LTV)',
`Crea una SaaS Metrics Dashboard:
- MRR, ARR, Net New MRR, Expansion
- Churn rate (logo e revenue)
- LTV e CAC per acquisition channel
- Cohort retention heatmap
- Trial → paid conversion funnel
- Benchmark vs industry average
- Slack/email alert per anomalie
Stack: Next.js, Stripe API, Chart.js, Redis, Anthropic`,'saas,metrics,dashboard,mrr'),

T('dash002','dashboard','📊','Marketing Attribution Dashboard','Attribuzione conversioni multi-touch',
`Crea una Marketing Attribution Dashboard:
- Traccia touchpoint: ads, email, organic, direct
- Modelli: last-click, first-click, linear, time-decay
- Revenue per canale con ROAS
- Customer journey visualization
- UTM builder integrato
- Google/Meta Ads API
- Budget optimizer AI
Stack: Next.js, Google Analytics API, Meta API, Anthropic`,'marketing,attribution,ads,analytics'),

];

export function getTemplatesByCategory(categoryId) {
  return TEMPLATES.filter(t => t.category === categoryId);
}

export function searchTemplates(query) {
  const q = query.toLowerCase();
  return TEMPLATES.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q)) ||
    t.category.toLowerCase().includes(q)
  );
}

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || null;
}
