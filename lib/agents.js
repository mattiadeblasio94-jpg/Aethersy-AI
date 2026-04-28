// OPEN SOURCE ONLY - No Anthropic

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

import { getHistory, saveMessage, rememberFact, recallMemory, getAllMemories, saveProject, getAllProjects } from './memory';
import { research, deepResearch, scrapeUrl, searchGitHub, getFinanceData, getCryptoPrice } from './research';

// Usa Ollama (open source) invece di Claude
async function callAgent(systemPrompt, messages, maxTokens = 1024) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';

  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: messages.map(m => `${m.role === 'system' ? 'Sistema' : m.role}: ${m.content}`).join('\n'),
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: maxTokens
        }
      })
    });

    if (!res.ok) return 'Errore AI (Ollama non disponibile)';
    const data = await res.json();
    return data.response || '';
  } catch (e) {
    console.log('Ollama error:', e.message);
    return 'AI non disponibile al momento';
  }
}

// ── Memory Agent ──────────────────────────────────────────────────────────────

export async function memoryAgent(action, payload) {
  if (action === 'save') {
    await rememberFact(payload.key, payload.value);
    return `Memorizzato: "${payload.key}"`;
  }
  if (action === 'recall') {
    const results = await recallMemory(payload.query);
    if (!results.length) return 'Nessun ricordo trovato per questa query.';
    return results.map(r => `• *${r.key}*: ${r.value}`).join('\n');
  }
  if (action === 'list') {
    const all = await getAllMemories();
    if (!all.length) return 'Memoria vuota.';
    return all.slice(0, 15).map(r => `• *${r.key}*: ${r.value}`).join('\n');
  }
}

// ── Research Agent ────────────────────────────────────────────────────────────

export async function researchAgent(query, deep = false) {
  const { results, fromCache, details } = deep
    ? await deepResearch(query)
    : await research(query);

  if (!results?.length && !details) return { summary: 'Nessun risultato trovato.', sources: [] };

  const context = deep
    ? [...(results || []).slice(0, 5).map(r => `${r.title}: ${r.snippet}`),
       ...(details || []).map(d => `[${d.title}] ${d.text?.slice(0, 800)}`)].join('\n\n')
    : (results || []).slice(0, 8).map(r => `${r.title}: ${r.snippet}`).join('\n\n');

  const summary = await callAgent(
    `Sei un ricercatore AI esperto. Analizza questi risultati e fornisci una sintesi chiara, dettagliata e utile in italiano. Includi dati concreti, tendenze e insight rilevanti. Cita le fonti principali.`,
    [{ role: 'user', content: `Query: "${query}"\n\nDati raccolti:\n${context}` }],
    deep ? 2048 : 1200
  );

  return { summary, sources: (results || []).slice(0, 6), fromCache };
}

// ── Project Agent ─────────────────────────────────────────────────────────────

export async function projectAgent(action, payload) {
  if (action === 'create') {
    const id = `proj_${Date.now()}`;
    const { name, description, chatId, type = 'business' } = payload;
    const plan = await callAgent(
      `Sei un project manager AI esperto. Crea un piano di progetto dettagliato con: obiettivi SMART, fasi di sviluppo con timeline, risorse necessarie, budget stimato, KPI, rischi e opportunità. Rispondi in italiano con formato markdown professionale.`,
      [{ role: 'user', content: `Progetto: "${name}" | Tipo: ${type}\nDescrizione: ${description || 'Da definire'}` }],
      2000
    );
    const project = { name, description, type, plan, chatId, status: 'attivo', files: [], notes: [] };
    await saveProject(id, project);
    return { id, ...project };
  }
  if (action === 'list') return getAllProjects();
  if (action === 'analyze') {
    const { project } = payload;
    return callAgent(
      `Sei un consulente strategico AI. Analizza il progetto e fornisci: stato attuale, rischi critici, opportunità di crescita e 5 prossimi passi concreti. In italiano, conciso e diretto.`,
      [{ role: 'user', content: `Analizza: ${JSON.stringify(project)}` }],
      800
    );
  }
}

// ── Monetization Agent ────────────────────────────────────────────────────────

export async function monetizationAgent(action, payload = {}) {
  if (action === 'strategy') {
    const { niche, budget, goal, platform } = payload;
    return callAgent(
      `Sei un esperto di monetizzazione digitale, growth hacking e advertising. Fornisci strategie CONCRETE con: canali specifici, budget allocation %, ROAS target, KPI misurabili, funnel di vendita e roadmap 30/60/90 giorni. Dati reali, no teoria generica. In italiano.`,
      [{ role: 'user', content: `Niche: ${niche} | Budget: €${budget || 'non definito'} | Goal: ${goal || 'non definito'} | Platform: ${platform || 'tutti'}\n\nCrea strategia di monetizzazione completa.` }],
      2000
    );
  }
  if (action === 'roas') {
    const { spend, revenue } = payload;
    const roas = spend > 0 ? (revenue / spend).toFixed(2) : 0;
    const analysis = await callAgent(
      `Sei un media buyer esperto. Analizza le performance ads e suggerisci ottimizzazioni concrete con budget allocation, targeting, creative testing.`,
      [{ role: 'user', content: `Spesa: €${spend} | Revenue: €${revenue} | ROAS: ${roas}` }],
      600
    );
    return { roas, spend, revenue, analysis };
  }
}

// ── Email Agent ───────────────────────────────────────────────────────────────

export async function emailAgent(action, payload = {}) {
  if (action === 'compose') {
    const { recipient, purpose, tone = 'professionale', context = '' } = payload;
    return callAgent(
      `Sei un copywriter esperto. Scrivi email professionali, convincenti e personalizzate in italiano. Usa struttura chiara: oggetto, apertura, corpo, CTA, firma. Tono: ${tone}.`,
      [{ role: 'user', content: `Destinatario: ${recipient || 'generico'}\nScopo: ${purpose}\nContesto: ${context}\n\nScrivi l'email completa con oggetto in evidenza.` }],
      800
    );
  }
  if (action === 'sequence') {
    const { niche, goal, emails = 5 } = payload;
    return callAgent(
      `Sei un email marketing specialist. Crea una sequenza email completa per nurturing e conversione. Ogni email deve avere: oggetto, corpo completo, CTA chiara.`,
      [{ role: 'user', content: `Nicchia: ${niche} | Goal: ${goal} | Sequenza di ${emails} email\n\nCrea la sequenza completa.` }],
      2500
    );
  }
}

// ── Conversational AI Agent (con Tool Calling REALE) ─────────────────────────

const AGENT_TOOLS = [
  {
    name: 'search_web',
    description: 'Cerca informazioni aggiornate su internet. USA SEMPRE questo tool per notizie, prezzi, aziende, mercati, trend, eventi recenti, statistiche. NON dire mai che non puoi cercare.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query di ricerca ottimizzata' },
        deep: { type: 'boolean', description: 'True per analisi approfondita con fonti accademiche (più lenta)' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_stock_price',
    description: 'Ottieni prezzo live di azioni, ETF, indici di borsa',
    input_schema: {
      type: 'object',
      properties: { symbol: { type: 'string', description: 'Simbolo borsa: AAPL, TSLA, NVDA, SPY, ENI.MI...' } },
      required: ['symbol']
    }
  },
  {
    name: 'get_crypto_price',
    description: 'Ottieni prezzo live di criptovalute in USD ed EUR',
    input_schema: {
      type: 'object',
      properties: { coin: { type: 'string', description: 'Nome crypto: bitcoin, ethereum, solana, binancecoin...' } },
      required: ['coin']
    }
  },
  {
    name: 'scrape_url',
    description: 'Leggi e analizza il contenuto di una pagina web o competitor. Usa per analizzare siti, leggere articoli, estrarre informazioni da URL.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'URL completo (https://)' } },
      required: ['url']
    }
  },
  {
    name: 'analyze_competitors',
    description: 'Analizza i principali competitor di un\'azienda o prodotto. Fornisce positioning, punti di forza/debolezza, prezzi, strategia.',
    input_schema: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Nome azienda o settore da analizzare' },
        aspect: { type: 'string', description: 'Aspetto focus: pricing, marketing, prodotto, SEO, social (opzionale)' }
      },
      required: ['business']
    }
  },
  {
    name: 'generate_seo_content',
    description: 'Genera contenuto SEO-ottimizzato: articolo blog, meta description, title tag, headings. Usa quando l\'utente vuole contenuto per il web.',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Argomento del contenuto' },
        type: { type: 'string', description: 'Tipo: article, meta, title, outline, faq, social_post' },
        keywords: { type: 'string', description: 'Keyword target (opzionale)' }
      },
      required: ['topic', 'type']
    }
  },
  {
    name: 'create_business_plan',
    description: 'Crea un business plan o strategia completa per un progetto, startup o idea di business.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome del progetto/business' },
        description: { type: 'string', description: 'Descrizione idea o servizio' },
        type: { type: 'string', description: 'Tipo: startup, ecommerce, saas, freelance, agenzia, immobiliare' }
      },
      required: ['name', 'description']
    }
  },
  {
    name: 'calculate_roi',
    description: 'Calcola ROI, ROAS, breakeven, LTV/CAC per campagne marketing o investimenti. Fornisce analisi finanziaria dettagliata.',
    input_schema: {
      type: 'object',
      properties: {
        investment: { type: 'number', description: 'Investimento iniziale in EUR' },
        revenue: { type: 'number', description: 'Revenue/ritorno in EUR' },
        context: { type: 'string', description: 'Contesto (ads, prodotto, immobile, ecc.)' }
      },
      required: ['investment', 'revenue']
    }
  },
];

export async function conversationAgent(chatId, userMessage) {
  const [history, memories, projects] = await Promise.all([
    getHistory(chatId, 12).catch(() => []),
    recallMemory(userMessage).catch(() => []),
    getAllProjects().catch(() => []),
  ]);

  const memCtx = memories.length
    ? `\nMemorie salvate:\n${memories.slice(0, 5).map(m => `- ${m.key}: ${m.value}`).join('\n')}`
    : '';
  const projCtx = projects.length
    ? `\nProgetti attivi: ${projects.slice(0, 5).map(p => p.name).join(', ')}`
    : '';

  const system = `Sei Lara AGENTE AI Aethersy — l'AI agent senior di Aethersy-AI, la piattaforma per imprenditori con il motto "Sogna, Realizza, Guadagna."

HAI ACCESSO REALE A INTERNET E AI SEGUENTI STRUMENTI:
🔍 search_web → cerca notizie, prezzi, mercati, aziende, trend, statistiche, qualsiasi dato
📈 get_stock_price → prezzo live azioni (AAPL, ENI.MI, NVDA, qualsiasi simbolo)
🪙 get_crypto_price → prezzo live crypto (bitcoin, ethereum, solana...)
🌐 scrape_url → leggi/analizza qualsiasi sito web o competitor
🏆 analyze_competitors → analisi competitor dettagliata
✍️ generate_seo_content → crea contenuti SEO, articoli, post social
📋 create_business_plan → crea piani di business completi
💰 calculate_roi → calcola ROI, ROAS, breakeven, analisi finanziaria

REGOLE ASSOLUTE:
1. NON dire MAI "non posso cercare su internet" — HAI internet tramite search_web
2. NON dire MAI che hai un knowledge cutoff per dati che puoi cercare — CERCA E BASTA
3. Per qualsiasi dato di mercato, notizia, prezzo, statistica → USA search_web IMMEDIATAMENTE
4. Rispondi in italiano, tono professionale, diretto, concreto con dati reali
5. Per codice → scrivi codice completo e pronto all'uso
6. Sii PROATTIVO: se l'utente chiede "come va il mercato?" → cerca senza aspettare conferma
7. Dopo ogni ricerca → sintetizza i dati in modo actionable per l'imprenditore
${memCtx}${projCtx}

SPECIALIZZAZIONI: business growth, digital marketing, finanza d'impresa, sviluppo software, automazioni, e-commerce, lead generation, SEO, social media, fundraising.`;

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system,
    tools: AGENT_TOOLS,
    messages,
  });

  // Handle tool calls
  if (response.stop_reason === 'tool_use') {
    const toolResultBlocks = [];

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let toolResult = 'Dati non disponibili';

      try {
        if (block.name === 'search_web') {
          const { summary, sources } = await researchAgent(block.input.query, !!block.input.deep);
          toolResult = summary;
          if (sources?.length) {
            const srcList = sources.slice(0, 3).filter(s => s.title).map(s => `• ${s.title}`).join('\n');
            if (srcList) toolResult += `\n\nFonti:\n${srcList}`;
          }
        } else if (block.name === 'get_stock_price') {
          const fin = await getFinanceData(block.input.symbol.toUpperCase());
          if (fin) {
            const sign = parseFloat(fin.change) >= 0 ? '+' : '';
            toolResult = `${fin.symbol}: ${fin.price} ${fin.currency} (${sign}${parseFloat(fin.change).toFixed(2)}%) | Max: ${fin.high} | Min: ${fin.low}`;
          }
        } else if (block.name === 'get_crypto_price') {
          const c = await getCryptoPrice(block.input.coin.toLowerCase());
          if (c) {
            const sign = (c.usd_24h_change || 0) >= 0 ? '+' : '';
            toolResult = `${block.input.coin}: $${c.usd} / €${c.eur} (${sign}${(c.usd_24h_change || 0).toFixed(2)}% 24h)`;
          }
        } else if (block.name === 'scrape_url') {
          const scraped = await scrapeUrl(block.input.url);
          toolResult = scraped?.ok ? scraped.text?.slice(0, 3000) || 'Pagina vuota' : `Impossibile leggere la pagina: ${scraped?.error || 'errore'}`;
        } else if (block.name === 'analyze_competitors') {
          const { business, aspect = 'generale' } = block.input;
          const { summary } = await researchAgent(`${business} competitor analysis ${aspect} 2025 pricing strategy`, false);
          toolResult = summary || 'Dati competitor non disponibili';
        } else if (block.name === 'generate_seo_content') {
          const { topic, type, keywords = '' } = block.input;
          const typeMap = {
            article: `articolo blog SEO-ottimizzato di 800 parole su "${topic}"${keywords ? ` con keyword: ${keywords}` : ''}`,
            meta: `meta description ottimizzata (155 caratteri) per pagina su "${topic}"`,
            title: `5 title tag SEO ottimizzati per "${topic}"`,
            outline: `outline completo (H1, H2, H3) per articolo su "${topic}"`,
            faq: `10 FAQ con risposte per "${topic}"`,
            social_post: `5 post social media (LinkedIn/Instagram/Twitter) su "${topic}"`,
          };
          const prompt = typeMap[type] || `contenuto ${type} su "${topic}"`;
          toolResult = await callAgent(
            `Sei un SEO specialist e copywriter esperto. Scrivi contenuti che rankano e convertono. In italiano.`,
            [{ role: 'user', content: `Crea: ${prompt}` }],
            1200
          );
        } else if (block.name === 'create_business_plan') {
          const { name, description, type = 'business' } = block.input;
          toolResult = await callAgent(
            `Sei un business consultant senior. Crea piani di business concreti con dati reali, KPI misurabili e roadmap 90/180/365 giorni.`,
            [{ role: 'user', content: `Business: "${name}" | Tipo: ${type}\n${description}\n\nCrea piano completo con: analisi mercato, positioning, revenue model, costi, proiezioni finanziarie, roadmap.` }],
            2000
          );
        } else if (block.name === 'calculate_roi') {
          const { investment, revenue, context = '' } = block.input;
          const roi = ((revenue - investment) / investment * 100).toFixed(1);
          const roas = (revenue / investment).toFixed(2);
          const profit = (revenue - investment).toFixed(2);
          toolResult = await callAgent(
            `Sei un CFO esperto. Analizza metriche finanziarie e dai consigli concreti per ottimizzare ROI.`,
            [{ role: 'user', content: `Investimento: €${investment} | Revenue: €${revenue} | ROI: ${roi}% | ROAS: ${roas}x | Profitto: €${profit}\nContesto: ${context}\n\nAnalizza e dai 5 raccomandazioni concrete per migliorare le performance.` }],
            800
          );
        }
      } catch (e) {
        toolResult = `Errore strumento: ${e.message}`;
      }

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: toolResult,
      });
    }

    // Second call with tool results
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system,
      messages: [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResultBlocks },
      ],
    });
  }

  const reply = response.content.find(b => b.type === 'text')?.text || 'Scusa, ho avuto un problema. Riprova.';

  await saveMessage(chatId, 'user', userMessage).catch(() => {});
  await saveMessage(chatId, 'assistant', reply).catch(() => {});
  autoSaveMemory(userMessage, reply).catch(() => {});

  return reply;
}

async function autoSaveMemory(userMsg, aiReply) {
  const patterns = [
    { regex: /il mio budget[^\d]*(\d+)/i, key: 'budget_utente' },
    { regex: /lavoro (in|nel|come) ([a-zA-Z\s]+)/i, key: 'settore_utente' },
    { regex: /mi chiamo ([a-zA-Z]+)/i, key: 'nome_utente' },
    { regex: /il mio obiettivo[:\s]+(.{10,80})/i, key: 'obiettivo_utente' },
    { regex: /la mia azienda si chiama ([a-zA-Z\s]+)/i, key: 'azienda_utente' },
    { regex: /il mio sito[:\s]+(https?:\/\/[^\s]+)/i, key: 'sito_utente' },
  ];
  for (const { regex, key } of patterns) {
    const match = userMsg.match(regex);
    if (match) await rememberFact(key, match[1] || match[2]).catch(() => {});
  }
}
