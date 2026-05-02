/**
 * Aethersy AI Tools Registry
 * 80+ strumenti AI per imprenditori professionali
 */

export interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  provider: 'groq' | 'elevenlabs' | 'replicate' | 'google' | 'stripe' | 'alibaba' | 'supabase';
  endpoint: string;
  methods: string[];
  pricing: {
    type: 'free' | 'credits' | 'subscription';
    amount?: number;
    currency?: string;
  };
  features: string[];
  status: 'active' | 'beta' | 'deprecated';
}

export const AI_TOOLS: AITool[] = [
  // ============================================
  // TEXT & WRITING (12 tools)
  // ============================================
  {
    id: 'ai-writer',
    name: 'AI Writer Pro',
    category: 'Writing',
    description: 'Genera contenuti professionali per blog, social, email marketing',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['SEO optimization', 'Multi-language', 'Tone adjustment', 'Plagiarism check'],
    status: 'active'
  },
  {
    id: 'copywriter',
    name: 'Copywriter AI',
    category: 'Writing',
    description: 'Copywriting persuasivo per landing page e广告',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['AIDA framework', 'PAS formula', 'Headline generator', 'CTA optimizer'],
    status: 'active'
  },
  {
    id: 'email-assistant',
    name: 'Email Assistant',
    category: 'Writing',
    description: 'Scrivi email professionali in secondi',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Template library', 'Auto-follow-up', 'Tone matcher', 'Grammar check'],
    status: 'active'
  },
  {
    id: 'blog-generator',
    name: 'Blog Generator',
    category: 'Writing',
    description: 'Articoli blog completi con ricerca keywords',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Keyword research', 'Outline builder', 'Internal linking', 'Meta tags'],
    status: 'active'
  },
  {
    id: 'social-media-manager',
    name: 'Social Media Manager',
    category: 'Writing',
    description: 'Pianifica contenuti per tutti i social',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Multi-platform', 'Hashtag generator', 'Posting schedule', 'Engagement tips'],
    status: 'active'
  },
  {
    id: 'press-release',
    name: 'Press Release Generator',
    category: 'Writing',
    description: 'Comunicati stampa professionali',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['AP style', 'Media list', 'Distribution tips', 'SEO optimized'],
    status: 'active'
  },
  {
    id: 'script-writer',
    name: 'Script Writer',
    category: 'Writing',
    description: 'Script per video YouTube, TikTok, Reels',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Hook generator', 'Timing optimizer', 'CTA placement', 'Viral formulas'],
    status: 'active'
  },
  {
    id: 'product-descriptions',
    name: 'Product Description AI',
    category: 'Writing',
    description: 'Descrizioni prodotto che convertono',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['Benefit-focused', 'SEO keywords', 'Multi-variant', 'Emotion triggers'],
    status: 'active'
  },
  {
    id: 'linkedin-optimizer',
    name: 'LinkedIn Optimizer',
    category: 'Writing',
    description: 'Ottimizza il tuo profilo LinkedIn',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Headline generator', 'About section', 'Experience rewriter', 'Skills matcher'],
    status: 'active'
  },
  {
    id: 'resume-builder',
    name: 'Resume Builder',
    category: 'Writing',
    description: 'CV professionali ATS-friendly',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['ATS optimization', 'Industry templates', 'Achievement quantifier', 'Cover letter'],
    status: 'active'
  },
  {
    id: 'translation-pro',
    name: 'Translation Pro',
    category: 'Writing',
    description: 'Traduzioni professionali in 50+ lingue',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['50+ languages', 'Context aware', 'Industry terminology', 'Cultural adaptation'],
    status: 'active'
  },
  {
    id: 'summarizer',
    name: 'Document Summarizer',
    category: 'Writing',
    description: 'Riassunti intelligenti di documenti lunghi',
    provider: 'groq',
    endpoint: '/api/tools/text',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Key points extraction', 'Executive summary', 'Bullet points', 'Action items'],
    status: 'active'
  },

  // ============================================
  // VOICE & AUDIO (8 tools)
  // ============================================
  {
    id: 'text-to-speech',
    name: 'Text to Speech',
    category: 'Voice',
    description: 'Voci AI realistiche per i tuoi contenuti',
    provider: 'elevenlabs',
    endpoint: '/api/tools/speech',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['40+ voices', '28 languages', 'Emotion control', 'SSML support'],
    status: 'active'
  },
  {
    id: 'speech-to-text',
    name: 'Speech to Text',
    category: 'Voice',
    description: 'Trascrizione audio con Groq Whisper',
    provider: 'groq',
    endpoint: '/api/tools/speech',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['99% accuracy', '50+ languages', 'Speaker detection', 'Timestamps'],
    status: 'active'
  },
  {
    id: 'voice-cloning',
    name: 'Voice Cloning',
    category: 'Voice',
    description: 'Clona la tua voce in 30 secondi',
    provider: 'elevenlabs',
    endpoint: '/api/tools/speech',
    methods: ['POST'],
    pricing: { type: 'subscription', amount: 99, currency: 'EUR' },
    features: ['Instant clone', 'High fidelity', 'Multi-sample', 'Commercial license'],
    status: 'beta'
  },
  {
    id: 'podcast-generator',
    name: 'Podcast Generator',
    category: 'Voice',
    description: 'Crea podcast AI con voci multiple',
    provider: 'elevenlabs',
    endpoint: '/api/tools/speech',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 10 },
    features: ['Multi-voice', 'Intro/outro', 'Background music', 'Auto-editing'],
    status: 'beta'
  },
  {
    id: 'audiobook-narrator',
    name: 'Audiobook Narrator',
    category: 'Voice',
    description: 'Narra i tuoi ebook in audiolibro',
    provider: 'elevenlabs',
    endpoint: '/api/tools/speech',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Chapter markers', 'Character voices', 'Pacing control', 'Export formats'],
    status: 'active'
  },
  {
    id: 'voice-changer',
    name: 'Voice Changer',
    category: 'Voice',
    description: 'Modifica la tua voce in tempo reale',
    provider: 'elevenlabs',
    endpoint: '/api/tools/speech',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['Real-time', '20+ effects', 'Pitch control', 'Noise reduction'],
    status: 'active'
  },
  {
    id: 'music-generator',
    name: 'AI Music Generator',
    category: 'Voice',
    description: 'Musica originale per i tuoi progetti',
    provider: 'replicate',
    endpoint: '/api/tools/audio',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Multiple genres', 'Loop creation', 'Stem separation', 'BPM control'],
    status: 'beta'
  },
  {
    id: 'sound-effects',
    name: 'Sound Effects Library',
    category: 'Voice',
    description: 'Effetti sonori AI on-demand',
    provider: 'replicate',
    endpoint: '/api/tools/audio',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['1000+ sounds', 'Custom generation', 'Format conversion', 'Royalty-free'],
    status: 'active'
  },

  // ============================================
  // IMAGE & VIDEO (15 tools)
  // ============================================
  {
    id: 'text-to-image',
    name: 'Text to Image',
    category: 'Image',
    description: 'Genera immagini da descrizioni testuali',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['SDXL Turbo', 'DALL-E 3', 'Midjourney style', '4K upscaling'],
    status: 'active'
  },
  {
    id: 'image-to-text',
    name: 'Image to Text',
    category: 'Image',
    description: 'Analisi intelligente di immagini',
    provider: 'groq',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['OCR', 'Object detection', 'Scene understanding', 'Caption generation'],
    status: 'active'
  },
  {
    id: 'logo-maker',
    name: 'AI Logo Maker',
    category: 'Image',
    description: 'Logo professionali in secondi',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Vector output', 'Multiple concepts', 'Brand guidelines', 'Transparent PNG'],
    status: 'active'
  },
  {
    id: 'background-remover',
    name: 'Background Remover',
    category: 'Image',
    description: 'Rimuovi sfondi automaticamente',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Hair detection', 'Batch processing', 'Edge refinement', 'API access'],
    status: 'active'
  },
  {
    id: 'image-upscaler',
    name: 'Image Upscaler',
    category: 'Image',
    description: 'Aumenta risoluzione senza perdere qualità',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['4x upscaling', 'Face enhancement', 'Artifact removal', 'Batch mode'],
    status: 'active'
  },
  {
    id: 'photo-restorer',
    name: 'Photo Restorer',
    category: 'Image',
    description: 'Restaure vecchie foto danneggiate',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Scratch removal', 'Color restoration', 'Face enhancement', 'Denoising'],
    status: 'active'
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer',
    category: 'Image',
    description: 'Applica stili artistici alle tue foto',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['50+ art styles', 'Custom styles', 'Intensity control', 'Real-time preview'],
    status: 'active'
  },
  {
    id: 'face-swap',
    name: 'Face Swap',
    category: 'Image',
    description: 'Scambia volti tra immagini',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['High accuracy', 'Multiple faces', 'Video support', 'Ethical safeguards'],
    status: 'beta'
  },
  {
    id: 'product-photography',
    name: 'Product Photography AI',
    category: 'Image',
    description: 'Foto prodotto professionali con sfondi AI',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Studio backgrounds', 'Shadow generation', 'Reflection control', 'Batch processing'],
    status: 'active'
  },
  {
    id: 'infographic-maker',
    name: 'Infographic Maker',
    category: 'Image',
    description: 'Infografiche da dati e testo',
    provider: 'groq',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Chart generation', 'Icon library', 'Brand colors', 'Export formats'],
    status: 'active'
  },
  {
    id: 'qr-code-generator',
    name: 'AI QR Code Generator',
    category: 'Image',
    description: 'QR code personalizzati con immagini integrate',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['Logo embedding', 'Color customization', 'High scannability', 'Analytics'],
    status: 'active'
  },
  {
    id: 'video-generator',
    name: 'Text to Video',
    category: 'Video',
    description: 'Genera video da descrizioni testuali',
    provider: 'replicate',
    endpoint: '/api/tools/video',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 10 },
    features: ['1080p output', '30fps', '5 second clips', 'Prompt guidance'],
    status: 'beta'
  },
  {
    id: 'video-editor',
    name: 'AI Video Editor',
    category: 'Video',
    description: 'Editing video automatico con AI',
    provider: 'replicate',
    endpoint: '/api/tools/video',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Auto-cut', 'Transition detection', 'Music sync', 'Subtitle generation'],
    status: 'beta'
  },
  {
    id: 'deepfake-detector',
    name: 'Deepfake Detector',
    category: 'Video',
    description: 'Rileva video e audio manipolati',
    provider: 'alibaba',
    endpoint: '/api/tools/video',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['99% accuracy', 'Frame analysis', 'Audio sync check', 'Report generation'],
    status: 'active'
  },
  {
    id: 'thumbnail-maker',
    name: 'YouTube Thumbnail AI',
    category: 'Video',
    description: 'Thumbnail virali per YouTube',
    provider: 'replicate',
    endpoint: '/api/tools/image',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['CTR optimization', 'Text overlay', 'Face enhancement', 'A/B variants'],
    status: 'active'
  },

  // ============================================
  // BUSINESS & PRODUCTIVITY (15 tools)
  // ============================================
  {
    id: 'business-plan-generator',
    name: 'Business Plan Generator',
    category: 'Business',
    description: 'Business plan completi in minuti',
    provider: 'groq',
    endpoint: '/api/tools/pdf',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 10 },
    features: ['Financial projections', 'Market analysis', 'Competitor research', 'Export PDF'],
    status: 'active'
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    category: 'Business',
    description: 'Fatture professionali automatiche',
    provider: 'google',
    endpoint: '/api/tools/pdf',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Multi-currency', 'Auto-numbering', 'Email sending', 'Payment tracking'],
    status: 'active'
  },
  {
    id: 'contract-generator',
    name: 'Contract Generator',
    category: 'Business',
    description: 'Contratti legali pronti all\'uso',
    provider: 'groq',
    endpoint: '/api/tools/pdf',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Legal templates', 'Clause library', 'E-signature ready', 'Version control'],
    status: 'active'
  },
  {
    id: 'meeting-assistant',
    name: 'Meeting Assistant',
    category: 'Business',
    description: 'Note e action items dalle riunioni',
    provider: 'groq',
    endpoint: '/api/tools/meeting',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Transcription', 'Summary', 'Action items', 'Calendar integration'],
    status: 'active'
  },
  {
    id: 'crm-assistant',
    name: 'CRM Assistant',
    category: 'Business',
    description: 'Gestione clienti intelligente',
    provider: 'supabase',
    endpoint: '/api/tools/crm',
    methods: ['POST', 'GET', 'PUT'],
    pricing: { type: 'subscription', amount: 29, currency: 'EUR' },
    features: ['Contact management', 'Deal tracking', 'Email automation', 'Analytics'],
    status: 'active'
  },
  {
    id: 'project-planner',
    name: 'AI Project Planner',
    category: 'Business',
    description: 'Pianificazione progetti con AI',
    provider: 'groq',
    endpoint: '/api/tools/planning',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Gantt charts', 'Resource allocation', 'Risk assessment', 'Timeline optimization'],
    status: 'active'
  },
  {
    id: 'financial-analyzer',
    name: 'Financial Analyzer',
    category: 'Business',
    description: 'Analisi finanziaria automatica',
    provider: 'groq',
    endpoint: '/api/tools/finance',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Ratio analysis', 'Trend detection', 'Forecasting', 'Report generation'],
    status: 'active'
  },
  {
    id: 'tax-calculator',
    name: 'Tax Calculator AI',
    category: 'Business',
    description: 'Calcolo tasse ottimizzato',
    provider: 'groq',
    endpoint: '/api/tools/finance',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Italian tax law', 'Deduction finder', 'Rate optimization', 'Form generation'],
    status: 'active'
  },
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    category: 'Business',
    description: 'Tracciamento spese con OCR',
    provider: 'google',
    endpoint: '/api/tools/finance',
    methods: ['POST', 'GET'],
    pricing: { type: 'free' },
    features: ['Receipt scanning', 'Auto-categorization', 'Budget alerts', 'Export reports'],
    status: 'active'
  },
  {
    id: 'pitch-deck-generator',
    name: 'Pitch Deck Generator',
    category: 'Business',
    description: 'Presentazioni investor-ready',
    provider: 'groq',
    endpoint: '/api/tools/presentation',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 10 },
    features: ['10-slide formula', 'Design templates', 'Financial slides', 'Export PPTX'],
    status: 'active'
  },
  {
    id: 'market-research',
    name: 'Market Research AI',
    category: 'Business',
    description: 'Analisi di mercato approfondita',
    provider: 'alibaba',
    endpoint: '/api/tools/research',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Competitor analysis', 'Market sizing', 'Trend reports', 'SWOT generation'],
    status: 'active'
  },
  {
    id: 'customer-persona',
    name: 'Customer Persona Generator',
    category: 'Business',
    description: 'Buyer personas dettagliate',
    provider: 'groq',
    endpoint: '/api/tools/marketing',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Demographics', 'Psychographics', 'Pain points', 'Journey mapping'],
    status: 'active'
  },
  {
    id: 'swot-analyzer',
    name: 'SWOT Analyzer',
    category: 'Business',
    description: 'Analisi SWOT automatica',
    provider: 'groq',
    endpoint: '/api/tools/strategy',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['AI insights', 'Competitor comparison', 'Action recommendations', 'Visual matrix'],
    status: 'active'
  },
  {
    id: 'okr-generator',
    name: 'OKR Generator',
    category: 'Business',
    description: 'Obiettivi e Key Results',
    provider: 'groq',
    endpoint: '/api/tools/planning',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Best practices', 'Progress tracking', 'Team alignment', 'Quarterly planning'],
    status: 'active'
  },
  {
    id: 'hr-assistant',
    name: 'HR Assistant',
    category: 'Business',
    description: 'Gestione risorse umane',
    provider: 'groq',
    endpoint: '/api/tools/hr',
    methods: ['POST', 'GET'],
    pricing: { type: 'subscription', amount: 49, currency: 'EUR' },
    features: ['Job descriptions', 'Interview questions', 'Onboarding flows', 'Compliance check'],
    status: 'active'
  },

  // ============================================
  // MARKETING & SEO (12 tools)
  // ============================================
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    category: 'Marketing',
    description: 'Ottimizzazione SEO on-page',
    provider: 'groq',
    endpoint: '/api/tools/seo',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Keyword density', 'Meta tags', 'Internal linking', 'Schema markup'],
    status: 'active'
  },
  {
    id: 'keyword-researcher',
    name: 'Keyword Researcher',
    category: 'Marketing',
    description: 'Ricerca keywords avanzata',
    provider: 'alibaba',
    endpoint: '/api/tools/seo',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Search volume', 'Competition score', 'Long-tail suggestions', 'SERP analysis'],
    status: 'active'
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar AI',
    category: 'Marketing',
    description: 'Pianificazione contenuti editoriale',
    provider: 'groq',
    endpoint: '/api/tools/marketing',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Topic ideas', 'Optimal timing', 'Platform-specific', 'Holiday integration'],
    status: 'active'
  },
  {
    id: 'hashtag-generator',
    name: 'Hashtag Generator',
    category: 'Marketing',
    description: 'Hashtag virali per social',
    provider: 'groq',
    endpoint: '/api/tools/marketing',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Platform optimized', 'Trend analysis', 'Niche targeting', 'Performance tracking'],
    status: 'active'
  },
  {
    id: 'ad-copy-generator',
    name: 'Ad Copy Generator',
    category: 'Marketing',
    description: 'Copy per Google Ads e Facebook',
    provider: 'groq',
    endpoint: '/api/tools/marketing',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Character limits', 'A/B variants', 'CTA optimization', 'Compliance check'],
    status: 'active'
  },
  {
    id: 'landing-page-builder',
    name: 'Landing Page Builder',
    category: 'Marketing',
    description: 'Landing page ad alta conversione',
    provider: 'groq',
    endpoint: '/api/tools/web',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 10 },
    features: ['AIDA structure', 'Social proof', 'Form optimization', 'Heatmap analysis'],
    status: 'active'
  },
  {
    id: 'email-campaigns',
    name: 'Email Campaign AI',
    category: 'Marketing',
    description: 'Campagne email automatizzate',
    provider: 'google',
    endpoint: '/api/tools/google',
    methods: ['POST'],
    pricing: { type: 'subscription', amount: 19, currency: 'EUR' },
    features: ['Sequence builder', 'A/B testing', 'Personalization', 'Analytics'],
    status: 'active'
  },
  {
    id: 'influencer-finder',
    name: 'Influencer Finder',
    category: 'Marketing',
    description: 'Trova influencer per il tuo brand',
    provider: 'alibaba',
    endpoint: '/api/tools/marketing',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Niche matching', 'Engagement analysis', 'Fake follower detection', 'Outreach templates'],
    status: 'active'
  },
  {
    id: 'brand-monitor',
    name: 'Brand Monitor',
    category: 'Marketing',
    description: 'Monitoraggio menzioni brand',
    provider: 'alibaba',
    endpoint: '/api/tools/monitoring',
    methods: ['GET'],
    pricing: { type: 'subscription', amount: 39, currency: 'EUR' },
    features: ['Real-time alerts', 'Sentiment analysis', 'Competitor tracking', 'Report generation'],
    status: 'active'
  },
  {
    id: 'conversion-optimizer',
    name: 'Conversion Rate Optimizer',
    category: 'Marketing',
    description: 'Aumenta le conversioni del sito',
    provider: 'groq',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Funnel analysis', 'A/B test ideas', 'Heatmap insights', 'ROI calculator'],
    status: 'active'
  },
  {
    id: 'pricedrop-alert',
    name: 'Price Drop Alert',
    category: 'Marketing',
    description: 'Monitoraggio prezzi competitor',
    provider: 'alibaba',
    endpoint: '/api/tools/monitoring',
    methods: ['POST', 'GET'],
    pricing: { type: 'subscription', amount: 29, currency: 'EUR' },
    features: ['Competitor tracking', 'Alert thresholds', 'Historical data', 'Report export'],
    status: 'active'
  },
  {
    id: 'viral-predictor',
    name: 'Viral Content Predictor',
    category: 'Marketing',
    description: 'Prevedi il potenziale virale',
    provider: 'alibaba',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Score prediction', 'Optimal timing', 'Platform matching', 'Trend alignment'],
    status: 'beta'
  },

  // ============================================
  // DEVELOPMENT & TECH (10 tools)
  // ============================================
  {
    id: 'code-generator',
    name: 'Code Generator',
    category: 'Development',
    description: 'Genera codice in qualsiasi linguaggio',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['50+ languages', 'Best practices', 'Documentation', 'Test generation'],
    status: 'active'
  },
  {
    id: 'code-reviewer',
    name: 'AI Code Reviewer',
    category: 'Development',
    description: 'Review automatica del codice',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Bug detection', 'Security audit', 'Performance tips', 'Refactoring suggestions'],
    status: 'active'
  },
  {
    id: 'sql-generator',
    name: 'SQL Generator',
    category: 'Development',
    description: 'Query SQL da linguaggio naturale',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Multi-database', 'Query optimization', 'Explanation', 'Safety check'],
    status: 'active'
  },
  {
    id: 'api-documenter',
    name: 'API Documenter',
    category: 'Development',
    description: 'Documentazione API automatica',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['OpenAPI spec', 'Code examples', 'Interactive docs', 'Version control'],
    status: 'active'
  },
  {
    id: 'regex-generator',
    name: 'Regex Generator',
    category: 'Development',
    description: 'Espressioni regolari spiegate semplice',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Natural language', 'Testing sandbox', 'Explanation', 'Optimization'],
    status: 'active'
  },
  {
    id: 'git-commit-generator',
    name: 'Git Commit Message AI',
    category: 'Development',
    description: 'Commit message convenzionali',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Conventional commits', 'Diff analysis', 'Multi-language', 'History learning'],
    status: 'active'
  },
  {
    id: 'dockerfile-generator',
    name: 'Dockerfile Generator',
    category: 'Development',
    description: 'Dockerfile ottimizzati',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Multi-stage builds', 'Security hardening', 'Size optimization', 'Best practices'],
    status: 'active'
  },
  {
    id: 'readme-generator',
    name: 'README Generator',
    category: 'Development',
    description: 'README professionali',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Auto-documentation', 'Badges', 'Installation guide', 'API examples'],
    status: 'active'
  },
  {
    id: 'error-explainer',
    name: 'Error Message Explainer',
    category: 'Development',
    description: 'Spiegazione errori di codice',
    provider: 'groq',
    endpoint: '/api/tools/code',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Plain language', 'Fix suggestions', 'Prevention tips', 'Related errors'],
    status: 'active'
  },
  {
    id: 'dependency-checker',
    name: 'Dependency Security Checker',
    category: 'Development',
    description: 'Scansione vulnerabilità dipendenze',
    provider: 'alibaba',
    endpoint: '/api/tools/security',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['CVE database', 'License check', 'Update suggestions', 'CI/CD integration'],
    status: 'active'
  },

  // ============================================
  // DATA & ANALYTICS (8 tools)
  // ============================================
  {
    id: 'data-visualizer',
    name: 'Data Visualizer',
    category: 'Analytics',
    description: 'Grafici e dashboard automatici',
    provider: 'groq',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Chart types', 'Auto-insights', 'Interactive', 'Export options'],
    status: 'active'
  },
  {
    id: 'predictive-analytics',
    name: 'Predictive Analytics',
    category: 'Analytics',
    description: 'Previsioni basate sui dati storici',
    provider: 'alibaba',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Time series', 'Regression', 'Classification', 'Confidence intervals'],
    status: 'active'
  },
  {
    id: 'sentiment-analyzer',
    name: 'Sentiment Analyzer',
    category: 'Analytics',
    description: 'Analisi sentiment di testi',
    provider: 'groq',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 1 },
    features: ['Multi-language', 'Emotion detection', 'Sarcasm detection', 'Batch processing'],
    status: 'active'
  },
  {
    id: 'survey-analyzer',
    name: 'Survey Analyzer',
    category: 'Analytics',
    description: 'Analisi automatica survey',
    provider: 'groq',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Open-ended analysis', 'Statistical tests', 'Cross-tabulation', 'Report export'],
    status: 'active'
  },
  {
    id: 'cohort-analyzer',
    name: 'Cohort Analysis',
    category: 'Analytics',
    description: 'Analisi coorte utenti',
    provider: 'supabase',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'subscription', amount: 49, currency: 'EUR' },
    features: ['Retention curves', 'Behavior tracking', 'Segmentation', 'Trend analysis'],
    status: 'active'
  },
  {
    id: 'funnel-analyzer',
    name: 'Funnel Analyzer',
    category: 'Analytics',
    description: 'Analisi funnel di conversione',
    provider: 'supabase',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 3 },
    features: ['Drop-off points', 'Segment comparison', 'Time analysis', 'Recommendations'],
    status: 'active'
  },
  {
    id: 'ab-test-calculator',
    name: 'A/B Test Calculator',
    category: 'Analytics',
    description: 'Calcolatore significatività statistica',
    provider: 'groq',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Sample size', 'Confidence level', 'Lift calculation', 'Bayesian analysis'],
    status: 'active'
  },
  {
    id: 'attribution-model',
    name: 'Attribution Modeler',
    category: 'Analytics',
    description: 'Modelli di attribuzione multi-touch',
    provider: 'groq',
    endpoint: '/api/tools/analytics',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['First/last touch', 'Linear', 'Time decay', 'Custom models'],
    status: 'active'
  },

  // ============================================
  // SECURITY & COMPLIANCE (5 tools)
  // ============================================
  {
    id: 'gdpr-checker',
    name: 'GDPR Compliance Checker',
    category: 'Security',
    description: 'Verifica conformità GDPR',
    provider: 'groq',
    endpoint: '/api/tools/compliance',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Privacy policy', 'Cookie audit', 'Data mapping', 'DPIA generator'],
    status: 'active'
  },
  {
    id: 'security-audit',
    name: 'Website Security Audit',
    category: 'Security',
    description: 'Scansione sicurezza sito web',
    provider: 'alibaba',
    endpoint: '/api/tools/security',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['SSL check', 'Headers analysis', 'Vulnerability scan', 'Remediation guide'],
    status: 'active'
  },
  {
    id: 'password-generator',
    name: 'Secure Password Generator',
    category: 'Security',
    description: 'Password forti e uniche',
    provider: 'groq',
    endpoint: '/api/tools/security',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Custom length', 'Character sets', 'Memorable options', 'Breach check'],
    status: 'active'
  },
  {
    id: 'phishing-detector',
    name: 'Phishing Email Detector',
    category: 'Security',
    description: 'Rileva email di phishing',
    provider: 'groq',
    endpoint: '/api/tools/security',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['URL analysis', 'Header inspection', 'Content scanning', 'Training mode'],
    status: 'active'
  },
  {
    id: 'terms-generator',
    name: 'Terms & Conditions Generator',
    category: 'Security',
    description: 'Termini di servizio legali',
    provider: 'groq',
    endpoint: '/api/tools/compliance',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 5 },
    features: ['Industry-specific', 'Multi-jurisdiction', 'Update alerts', 'Plain language'],
    status: 'active'
  },

  // ============================================
  // EDUCATION & LEARNING (5 tools)
  // ============================================
  {
    id: 'course-creator',
    name: 'Online Course Creator',
    category: 'Education',
    description: 'Crea corsi online completi',
    provider: 'groq',
    endpoint: '/api/tools/education',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 10 },
    features: ['Curriculum builder', 'Quiz generation', 'Certificate templates', 'SCORM export'],
    status: 'active'
  },
  {
    id: 'flashcard-generator',
    name: 'Flashcard Generator',
    category: 'Education',
    description: 'Flashcard per studio efficiente',
    provider: 'groq',
    endpoint: '/api/tools/education',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Spaced repetition', 'Image support', 'Quiz mode', 'Anki export'],
    status: 'active'
  },
  {
    id: 'lesson-planner',
    name: 'Lesson Planner AI',
    category: 'Education',
    description: 'Piani lezione strutturati',
    provider: 'groq',
    endpoint: '/api/tools/education',
    methods: ['POST'],
    pricing: { type: 'credits', amount: 2 },
    features: ['Objective alignment', 'Activity ideas', 'Assessment rubrics', 'Standards mapping'],
    status: 'active'
  },
  {
    id: 'math-solver',
    name: 'Math Problem Solver',
    category: 'Education',
    description: 'Risoluzione problemi matematici',
    provider: 'groq',
    endpoint: '/api/tools/education',
    methods: ['POST'],
    pricing: { type: 'free' },
    features: ['Step-by-step', 'Multiple methods', 'Graph visualization', 'Practice problems'],
    status: 'active'
  },
  {
    id: 'language-tutor',
    name: 'AI Language Tutor',
    category: 'Education',
    description: 'Impara lingue con AI',
    provider: 'groq',
    endpoint: '/api/tools/education',
    methods: ['POST'],
    pricing: { type: 'subscription', amount: 15, currency: 'EUR' },
    features: ['Conversation practice', 'Grammar correction', 'Pronunciation', 'Progress tracking'],
    status: 'active'
  }
];

// ============================================
// CATEGORIE DISPONIBILI
// ============================================

export const TOOL_CATEGORIES = [
  { id: 'Writing', name: 'Writing & Content', icon: '✍️', count: 12 },
  { id: 'Voice', name: 'Voice & Audio', icon: '🎙️', count: 8 },
  { id: 'Image', name: 'Image Generation', icon: '🎨', count: 12 },
  { id: 'Video', name: 'Video & Animation', icon: '🎬', count: 3 },
  { id: 'Business', name: 'Business Tools', icon: '💼', count: 15 },
  { id: 'Marketing', name: 'Marketing & SEO', icon: '📈', count: 12 },
  { id: 'Development', name: 'Development', icon: '💻', count: 10 },
  { id: 'Analytics', name: 'Data & Analytics', icon: '📊', count: 8 },
  { id: 'Security', name: 'Security & Compliance', icon: '🔒', count: 5 },
  { id: 'Education', name: 'Education', icon: '📚', count: 5 }
];

// ============================================
// FUNZIONI UTILI
// ============================================

export function getToolsByCategory(category: string): AITool[] {
  return AI_TOOLS.filter(tool => tool.category === category);
}

export function searchTools(query: string): AITool[] {
  const q = query.toLowerCase();
  return AI_TOOLS.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.features.some(f => f.toLowerCase().includes(q))
  );
}

export function getToolById(id: string): AITool | undefined {
  return AI_TOOLS.find(tool => tool.id === id);
}

export function getActiveTools(): AITool[] {
  return AI_TOOLS.filter(tool => tool.status === 'active');
}

export function getFreeTools(): AITool[] {
  return AI_TOOLS.filter(tool => tool.pricing.type === 'free');
}

export function getTotalTools(): number {
  return AI_TOOLS.length;
}
