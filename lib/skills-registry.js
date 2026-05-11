/**
 * Skills Registry - Competenze come Tools per LLM
 * Ogni skill è una funzione eseguibile che l'AI può chiamare
 * Usage: import { executeSkill, listSkills } from '@/lib/skills-registry'
 */

// ============================================
// REGISTRY DELLE SKILLS
// ============================================

export const SKILLS = {
  // ============================================
  // PDF SKILL - Estrazione testo da PDF
  // ============================================
  pdf_extractor: {
    name: 'PDF Extractor',
    description: 'Estrae testo da file PDF. Utile per analizzare documenti, contratti, report.',
    icon: '📄',
    category: 'document',
    parameters: {
      fileUrl: { type: 'string', required: true, description: 'URL del file PDF' },
      extractImages: { type: 'boolean', required: false, default: false, description: 'Estrarre anche le immagini' },
      pages: { type: 'string', required: false, description: 'Pagine da estrarre (es: "1-5,8,10-")' }
    },
    returns: { text: 'string', pageCount: 'number', metadata: 'object' }
  },

  // ============================================
  // SEO SKILL - Analisi SEO on-page
  // ============================================
  seo_analyzer: {
    name: 'SEO Analyzer',
    description: 'Analizza una pagina web per SEO: title, meta, headings, keywords, performance.',
    icon: '🔍',
    category: 'marketing',
    parameters: {
      url: { type: 'string', required: true, description: 'URL della pagina da analizzare' },
      focusKeyword: { type: 'string', required: false, description: 'Keyword principale da verificare' },
      language: { type: 'string', required: false, default: 'it', description: 'Lingua della pagina' }
    },
    returns: { score: 'number', issues: 'array', suggestions: 'array', data: 'object' }
  },

  // ============================================
  // EXCEL SKILL - Manipolazione fogli di calcolo
  // ============================================
  excel_processor: {
    name: 'Excel Processor',
    description: 'Legge, scrive e manipola file Excel (.xlsx). Analisi dati, formule, pivot.',
    icon: '📊',
    category: 'data',
    parameters: {
      fileUrl: { type: 'string', required: true, description: 'URL del file Excel' },
      action: { type: 'string', required: true, enum: ['read', 'write', 'analyze', 'formula'], description: 'Azione da eseguire' },
      sheet: { type: 'string', required: false, default: 0, description: 'Foglio (nome o indice)' },
      range: { type: 'string', required: false, description: 'Range di celle (es: "A1:B10")' },
      data: { type: 'array', required: false, description: 'Dati da scrivere (per action=write)' }
    },
    returns: { data: 'array', rows: 'number', columns: 'number', analysis: 'object' }
  },

  // ============================================
  // WEB SEARCH SKILL - Ricerca in tempo reale
  // ============================================
  web_search: {
    name: 'Web Search',
    description: 'Cerca informazioni sul web in tempo reale. Usa Serper/Google.',
    icon: '🌐',
    category: 'research',
    parameters: {
      query: { type: 'string', required: true, description: 'Query di ricerca' },
      numResults: { type: 'number', required: false, default: 10, description: 'Numero di risultati' },
      timeRange: { type: 'string', required: false, enum: ['any', 'past_hour', 'past_day', 'past_week', 'past_month', 'past_year'], description: 'Filtro temporale' }
    },
    returns: { results: 'array', summary: 'string', sources: 'array' }
  },

  // ============================================
  // SOCIAL MEDIA SKILL - Generazione post
  // ============================================
  social_generator: {
    name: 'Social Media Generator',
    description: 'Crea post per social media: Instagram, LinkedIn, Twitter, Facebook, TikTok.',
    icon: '📱',
    category: 'marketing',
    parameters: {
      platform: { type: 'string', required: true, enum: ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok'], description: 'Piattaforma social' },
      topic: { type: 'string', required: true, description: 'Argomento del post' },
      tone: { type: 'string', required: false, enum: ['professionale', 'amichevole', 'divertente', 'urgente', 'ispirazionale'], description: 'Tono di voce' },
      includeHashtags: { type: 'boolean', required: false, default: true, description: 'Includere hashtag' }
    },
    returns: { content: 'string', hashtags: 'array', imagePrompt: 'string' }
  },

  // ============================================
  // EMAIL SKILL - Scrittura email professionali
  // ============================================
  email_writer: {
    name: 'Email Writer',
    description: 'Scrive email professionali, persuasive o informative. Include oggetto e corpo.',
    icon: '📧',
    category: 'communication',
    parameters: {
      purpose: { type: 'string', required: true, description: 'Scopo dell\'email (es: proposta, follow-up, reclamo)' },
      recipient: { type: 'string', required: true, description: 'Destinatario (es: cliente, fornitore, CEO)' },
      tone: { type: 'string', required: false, enum: ['formale', 'informale', 'persuasivo', 'amichevole'], description: 'Tono' },
      context: { type: 'string', required: false, description: 'Contesto aggiuntivo' }
    },
    returns: { subject: 'string', body: 'string', suggestions: 'array' }
  },

  // ============================================
  // CODE GENERATOR SKILL - Generazione codice
  // ============================================
  code_generator: {
    name: 'Code Generator',
    description: 'Genera codice in 15+ linguaggi: JavaScript, Python, TypeScript, SQL, etc.',
    icon: '💻',
    category: 'development',
    parameters: {
      language: { type: 'string', required: true, description: 'Linguaggio di programmazione' },
      description: { type: 'string', required: true, description: 'Descrizione della funzionalità' },
      framework: { type: 'string', required: false, description: 'Framework (es: React, Express, Django)' },
      includeTests: { type: 'boolean', required: false, default: false, description: 'Includere test' }
    },
    returns: { code: 'string', language: 'string', explanation: 'string', tests: 'string' }
  },

  // ============================================
  // IMAGE GENERATOR SKILL - Generazione immagini
  // ============================================
  image_generator: {
    name: 'Image Generator',
    description: 'Genera immagini con AI (FLUX, Stable Diffusion) da prompt testuale.',
    icon: '🎨',
    category: 'creative',
    parameters: {
      prompt: { type: 'string', required: true, description: 'Descrizione dell\'immagine' },
      style: { type: 'string', required: false, enum: ['realistic', 'artistic', 'anime', '3d', 'minimal'], description: 'Stile artistico' },
      aspectRatio: { type: 'string', required: false, enum: ['1:1', '16:9', '9:16', '4:3', '3:2'], description: 'Aspect ratio' },
      negativePrompt: { type: 'string', required: false, description: 'Cosa escludere' }
    },
    returns: { imageUrl: 'string', prompt: 'string', model: 'string' }
  },

  // ============================================
  // VIDEO GENERATOR SKILL - Generazione video
  // ============================================
  video_generator: {
    name: 'Video Generator',
    description: 'Genera video corti (5-10 sec) con AI (Wan 2.1, LTX Video).',
    icon: '🎬',
    category: 'creative',
    parameters: {
      prompt: { type: 'string', required: true, description: 'Descrizione della scena' },
      duration: { type: 'number', required: false, default: 5, description: 'Durata in secondi' },
      style: { type: 'string', required: false, enum: ['cinematic', 'realistic', 'animated', 'abstract'], description: 'Stile video' }
    },
    returns: { videoUrl: 'string', prompt: 'string', model: 'string', duration: 'number' }
  },

  // ============================================
  // CONTRACT GENERATOR SKILL - Contratti legali
  // ============================================
  contract_generator: {
    name: 'Contract Generator',
    description: 'Genera contratti legali: NDA, service agreement, privacy policy.',
    icon: '📝',
    category: 'legal',
    parameters: {
      type: { type: 'string', required: true, enum: ['nda', 'service_agreement', 'privacy_policy', 'terms_of_service', 'freelance_contract'], description: 'Tipo di contratto' },
      jurisdiction: { type: 'string', required: false, default: 'IT', description: 'Giurisdizione (es: IT, US)' },
      parties: { type: 'array', required: false, description: 'Parti coinvolte' }
    },
    returns: { contract: 'string', clauses: 'array', warnings: 'array' }
  },

  // ============================================
  // FINANCE ANALYZER SKILL - Analisi finanziaria
  // ============================================
  finance_analyzer: {
    name: 'Finance Analyzer',
    description: 'Analisi finanziaria: crypto, stocks, forex. Dati in tempo reale.',
    icon: '📈',
    category: 'finance',
    parameters: {
      symbol: { type: 'string', required: true, description: 'Simbolo (es: BTC, AAPL, EURUSD)' },
      timeframe: { type: 'string', required: false, enum: ['1h', '1d', '1w', '1M', '1Y'], description: 'Timeframe' },
      indicators: { type: 'array', required: false, description: 'Indicatori (es: RSI, MACD, MA)' }
    },
    returns: { price: 'number', change: 'number', analysis: 'string', signals: 'array' }
  },

  // ============================================
  // TRANSLATOR SKILL - Traduzione 127 lingue
  // ============================================
  translator: {
    name: 'Translator',
    description: 'Traduce testo in 127 lingue mantenendo contesto e formattazione.',
    icon: '🌐',
    category: 'communication',
    parameters: {
      text: { type: 'string', required: true, description: 'Testo da tradurre' },
      sourceLang: { type: 'string', required: false, description: 'Lingua sorgente (auto-detect se omessa)' },
      targetLang: { type: 'string', required: true, description: 'Lingua target (es: "en", "es", "zh")' }
    },
    returns: { translated: 'string', sourceLang: 'string', targetLang: 'string' }
  },

  // ============================================
  // FUNNEL BUILDER SKILL - Crea funnel di vendita
  // ============================================
  funnel_builder: {
    name: 'Funnel Builder',
    description: 'Progetta funnel di vendita completi: landing, email sequence, upsell.',
    icon: '🔄',
    category: 'marketing',
    parameters: {
      niche: { type: 'string', required: true, description: 'Nicchia di mercato' },
      product: { type: 'string', required: true, description: 'Prodotto/servizio' },
      targetAudience: { type: 'string', required: true, description: 'Target audience' },
      goal: { type: 'string', required: false, description: 'Obiettivo (es: lead gen, sales)' }
    },
    returns: { funnel: 'object', landingCopy: 'string', emailSequence: 'array' }
  },

  // ============================================
  // BUSINESS PLAN SKILL - Piano business
  // ============================================
  business_plan: {
    name: 'Business Plan Generator',
    description: 'Crea business plan completo: executive summary,市场分析, financials.',
    icon: '📋',
    category: 'business',
    parameters: {
      idea: { type: 'string', required: true, description: 'Idea di business' },
      market: { type: 'string', required: false, description: 'Mercato di riferimento' },
      revenueModel: { type: 'string', required: false, description: 'Modello di revenue' }
    },
    returns: { plan: 'object', executiveSummary: 'string', financials: 'object' }
  },

  // ============================================
  // COMPETITOR ANALYSIS SKILL - Analisi competitor
  // ============================================
  competitor_analysis: {
    name: 'Competitor Analysis',
    description: 'Analizza competitor: pricing, features, marketing strategy.',
    icon: '🏆',
    category: 'business',
    parameters: {
      niche: { type: 'string', required: true, description: 'Nicchia/mercato' },
      competitors: { type: 'array', required: false, description: 'Lista competitor (URL o nomi)' },
      aspects: { type: 'array', required: false, description: 'Aspetti da analizzare (es: pricing, features)' }
    },
    returns: { competitors: 'array', comparison: 'object', opportunities: 'array' }
  }
};

// ============================================
// EXECUTOR DELLE SKILLS
// ============================================

/**
 * Esegue una skill con i parametri forniti
 * @param {string} skillId - ID della skill
 * @param {object} params - Parametri per la skill
 * @param {object} context - Contesto utente (userId, credits, etc.)
 */
export async function executeSkill(skillId, params, context = {}) {
  const skill = SKILLS[skillId];
  if (!skill) {
    throw new Error(`Skill "${skillId}" non trovata`);
  }

  // Validazione parametri
  const validation = validateParams(skill.parameters, params);
  if (!validation.valid) {
    throw new Error(`Parametri invalidi: ${validation.errors.join(', ')}`);
  }

  // Esecuzione skill specifica
  switch (skillId) {
    case 'pdf_extractor':
      return executePdfExtractor(params, context);
    case 'seo_analyzer':
      return executeSeoAnalyzer(params, context);
    case 'excel_processor':
      return executeExcelProcessor(params, context);
    case 'web_search':
      return executeWebSearch(params, context);
    case 'social_generator':
      return executeSocialGenerator(params, context);
    case 'email_writer':
      return executeEmailWriter(params, context);
    case 'code_generator':
      return executeCodeGenerator(params, context);
    case 'image_generator':
      return executeImageGenerator(params, context);
    case 'video_generator':
      return executeVideoGenerator(params, context);
    case 'contract_generator':
      return executeContractGenerator(params, context);
    case 'finance_analyzer':
      return executeFinanceAnalyzer(params, context);
    case 'translator':
      return executeTranslator(params, context);
    case 'funnel_builder':
      return executeFunnelBuilder(params, context);
    case 'business_plan':
      return executeBusinessPlan(params, context);
    case 'competitor_analysis':
      return executeCompetitorAnalysis(params, context);
    default:
      throw new Error(`Skill "${skillId}" non implementata`);
  }
}

/**
 * Validazione parametri
 */
function validateParams(paramSchema, params) {
  const errors = [];
  for (const [key, schema] of Object.entries(paramSchema)) {
    if (schema.required && (params[key] === undefined || params[key] === null)) {
      errors.push(`${key} è richiesto`);
    }
    if (schema.enum && params[key] && !schema.enum.includes(params[key])) {
      errors.push(`${key} deve essere uno di: ${schema.enum.join(', ')}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ============================================
// IMPLEMENTAZIONI SKILLS
// ============================================

async function executePdfExtractor(params, context) {
  // Implementazione con pdfjs-dist o API esterna
  const { fileUrl, extractImages = false, pages } = params;

  try {
    // Per ora usa API interna o servizio esterno
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tools/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fileUrl, extractImages, pages })
    });

    if (!response.ok) throw new Error('PDF extraction failed');
    const data = await response.json();

    return {
      text: data.text || '',
      pageCount: data.pageCount || 0,
      metadata: data.metadata || {},
      success: true
    };
  } catch (error) {
    return { error: error.message, success: false };
  }
}

async function executeSeoAnalyzer(params, context) {
  const { url, focusKeyword, language = 'it' } = params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tools/seo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, focusKeyword, language })
    });

    const data = await response.json();
    return {
      score: data.score || 0,
      issues: data.issues || [],
      suggestions: data.suggestions || [],
      data: data.data || {},
      success: true
    };
  } catch (error) {
    return { error: error.message, success: false };
  }
}

async function executeExcelProcessor(params, context) {
  const { fileUrl, action, sheet, range, data } = params;

  // Implementazione con SheetJS o API
  return {
    data: data || [],
    rows: 0,
    columns: 0,
    analysis: {},
    success: true,
    message: 'Excel processing - implementazione in sviluppo'
  };
}

async function executeWebSearch(params, context) {
  const { query, numResults = 10, timeRange } = params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, deep: false })
    });

    const data = await response.json();
    return {
      results: data.results || [],
      summary: data.summary || '',
      sources: data.sources || [],
      success: true
    };
  } catch (error) {
    return { error: error.message, success: false };
  }
}

async function executeSocialGenerator(params, context) {
  const { platform, topic, tone, includeHashtags = true } = params;

  // Usa LLM per generare il post
  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Genera un post per ${platform} su "${topic}" con tono ${tone}. ${includeHashtags ? 'Includi hashtag rilevanti.' : ''}` }
  ]);

  return {
    content: result.content,
    hashtags: includeHashtags ? extractHashtags(result.content) : [],
    imagePrompt: `Image for ${platform} post about ${topic}`,
    success: true
  };
}

async function executeEmailWriter(params, context) {
  const { purpose, recipient, tone, context } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Scrivi un'email ${tone} per ${recipient}. Scopo: ${purpose}. ${context ? 'Contesto: ' + context : ''}` }
  ]);

  // Parse subject e body
  const lines = result.content.split('\n');
  const subject = lines[0]?.replace(/Oggetto:|Subject:/i, '').trim() || 'Senza oggetto';
  const body = lines.slice(1).join('\n').trim();

  return {
    subject,
    body,
    suggestions: ['Personalizza con il nome del destinatario', 'Aggiungi una call-to-action chiara'],
    success: true
  };
}

async function executeCodeGenerator(params, context) {
  const { language, description, framework, includeTests = false } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Genera codice ${language}${framework ? ` con ${framework}` : ''}. ${description}. ${includeTests ? 'Includi test.' : ''}` }
  ]);

  // Estrai codice dal blocco markdown
  const codeMatch = result.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : result.content;

  return {
    code,
    language,
    explanation: 'Codice generato con AI. Revisiona prima dell\'uso in produzione.',
    tests: includeTests ? '// Test da implementare' : null,
    success: true
  };
}

async function executeImageGenerator(params, context) {
  const { prompt, style, aspectRatio, negativePrompt } = params;

  // Usa API Replicate o HuggingFace
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/studio/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style, aspectRatio })
  });

  const data = await response.json();
  return {
    imageUrl: data.url || data.output,
    prompt,
    model: 'flux-pro',
    success: true
  };
}

async function executeVideoGenerator(params, context) {
  const { prompt, duration = 5, style } = params;

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/studio/video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration, style })
  });

  const data = await response.json();
  return {
    videoUrl: data.url || data.output,
    prompt,
    model: 'wan-2.1',
    duration,
    success: true
  };
}

async function executeContractGenerator(params, context) {
  const { type, jurisdiction = 'IT', parties } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Genera un contratto ${type} per la giurisdizione ${jurisdiction}. Parti: ${parties?.join(', ') || 'da specificare'}. Includi tutte le clausole necessarie.` }
  ]);

  return {
    contract: result.content,
    clauses: ['Confidenzialità', 'Termini di pagamento', 'Responsabilità', 'Risoluzione'],
    warnings: ['Questo è un template. Consulta un legale per validità.'],
    success: true
  };
}

async function executeFinanceAnalyzer(params, context) {
  const { symbol, timeframe, indicators } = params;

  // Fetch dati finanziari da API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crypto?symbol=${symbol}`);
  const data = await response.json();

  return {
    price: data.price || 0,
    change: data.change24h || 0,
    analysis: `Analisi tecnica per ${symbol} su timeframe ${timeframe || '1d'}`,
    signals: indicators || [],
    success: true
  };
}

async function executeTranslator(params, context) {
  const { text, sourceLang, targetLang } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Traduci in ${targetLang}${sourceLang ? ` da ${sourceLang}` : ''}: "${text.slice(0, 500)}"` }
  ]);

  return {
    translated: result.content,
    sourceLang: sourceLang || 'auto',
    targetLang,
    success: true
  };
}

async function executeFunnelBuilder(params, context) {
  const { niche, product, targetAudience, goal } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Crea un funnel di vendita per ${niche}, prodotto: ${product}, target: ${targetAudience}${goal ? `, goal: ${goal}` : ''}. Includi: landing page copy, email sequence, upsell.` }
  ]);

  return {
    funnel: { stages: ['awareness', 'interest', 'decision', 'action'] },
    landingCopy: result.content,
    emailSequence: ['Email 1: Benvenuto', 'Email 2: Valore', 'Email 3: Offerta', 'Email 4: Urgenza'],
    success: true
  };
}

async function executeBusinessPlan(params, context) {
  const { idea, market, revenueModel } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Crea business plan per: ${idea}${market ? `, mercato: ${market}` : ''}${revenueModel ? `, revenue: ${revenueModel}` : ''}. Includi executive summary,市场分析, financials.` }
  ]);

  return {
    plan: { sections: ['Executive Summary', 'Market Analysis', 'Product', 'Marketing', 'Financials'] },
    executiveSummary: result.content.slice(0, 1000),
    financials: { projection3Y: 'Da definire' },
    success: true
  };
}

async function executeCompetitorAnalysis(params, context) {
  const { niche, competitors, aspects } = params;

  const { getCompletion } = await import('./llm-provider');
  const result = await getCompletion('openrouter:qwen/qwen-2.5-72b-instruct', [
    { role: 'user', content: `Analisi competitor per ${niche}. Competitor: ${competitors?.join(', ') || 'principali player'}. Aspetti: ${aspects?.join(', ') || 'pricing, features, marketing'}. Fornisci confronto e opportunità.` }
  ]);

  return {
    competitors: competitors || [],
    comparison: { matrix: 'Competitor comparison matrix' },
    opportunities: ['Differentiation opportunity 1', 'Gap nel mercato', 'Underserved segment'],
    success: true
  };
}

// ============================================
// UTILS
// ============================================

function extractHashtags(text) {
  const matches = text.match(/#[\wÀ-ÿ_]+/g) || [];
  return [...new Set(matches)];
}

/**
 * Lista tutte le skills disponibili
 */
export function listSkills(category = null) {
  if (category) {
    return Object.entries(SKILLS)
      .filter(([_, skill]) => skill.category === category)
      .map(([id, skill]) => ({ id, ...skill }));
  }
  return Object.entries(SKILLS).map(([id, skill]) => ({ id, ...skill }));
}

/**
 * Ottieni i dettagli di una skill
 */
export function getSkillDetails(skillId) {
  return SKILLS[skillId] || null;
}

/**
 * Converte skill in formato "tool" per LLM (OpenAI function calling)
 */
export function skillToTool(skillId) {
  const skill = SKILLS[skillId];
  if (!skill) return null;

  const parameters = {};
  const required = [];

  for (const [key, schema] of Object.entries(skill.parameters)) {
    parameters[key] = {
      type: schema.type === 'string' ? 'string' : schema.type === 'number' ? 'number' : schema.type === 'boolean' ? 'boolean' : 'object',
      description: schema.description
    };
    if (schema.required) required.push(key);
    if (schema.enum) parameters[key].enum = schema.enum;
  }

  return {
    type: 'function',
    function: {
      name: skillId,
      description: skill.description,
      parameters: {
        type: 'object',
        properties: parameters,
        required
      }
    }
  };
}
