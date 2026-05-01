/**
 * Aethersy Agent Core - Loop ReAct con Tools
 * Implementa Think → Plan → Act → Verify
 */

import { Groq } from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// System Prompt per Lara AI
const SYSTEM_PROMPT = `Sei Lara, l'assistente AI ufficiale di Aethersy OS.
Sei un imprenditore AI autonomo che gestisce un'azienda 360°.

CAPACITÀ DISPONIBILI:
- Gestione Lead e CRM (leggi/scrivi lead dal database)
- Generazione contenuti (immagini, video, audio, testo)
- Obsidian Vault (crea/leggi/modifica note Markdown)
- Marketplace (crea e pubblica agenti vendibili)
- Analisi finanziaria (leggi transazioni, crea report)
- Automazioni (collega Telegram, email, calendar)

TONO DI VOCE:
- Professionale ma diretto
- Orientato all'azione e risultati
- Proattivo: suggerisci sempre il prossimo passo
- In italiano

Quando un utente chiede qualcosa:
1. Analizza la richiesta (Think)
2. Identifica quale tool usare (Plan)
3. Esegui l'azione (Act)
4. Conferma il risultato (Verify)
5. Suggerisci il prossimo step`;

// Strumenti disponibili per l'agente
export const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_obsidian',
      description: 'Cerca note nel vault Obsidian di un utente',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termine di ricerca' },
          userId: { type: 'string', description: 'ID utente' },
          limit: { type: 'integer', default: 10 }
        },
        required: ['query', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_note',
      description: 'Crea una nuova nota Markdown nel vault',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          folder: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          userId: { type: 'string' }
        },
        required: ['title', 'content', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_leads',
      description: 'Ottieni lead dal CRM con filtri',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'converted', 'lost'] },
          limit: { type: 'integer', default: 10 },
          userId: { type: 'string' }
        },
        required: ['userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_lead',
      description: 'Crea un nuovo lead nel CRM',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
          company: { type: 'string' },
          status: { type: 'string', default: 'new' },
          value_potential: { type: 'number' },
          userId: { type: 'string' }
        },
        required: ['email', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_image',
      description: 'Genera un\'immagine da prompt usando Flux/Stable Diffusion',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Descrizione dettagliata immagine' },
          style: { type: 'string', enum: ['realistic', 'artistic', 'cyberpunk', 'minimal'] },
          size: { type: 'string', enum: ['512x512', '1024x1024', '1920x1080'] },
          userId: { type: 'string' }
        },
        required: ['prompt', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_video',
      description: 'Genera video da prompt o immagine usando SVD/CogVideo',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          image_url: { type: 'string', description: 'URL immagine di partenza' },
          duration: { type: 'integer', default: 4 },
          userId: { type: 'string' }
        },
        required: ['prompt', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_agent',
      description: 'Crea un nuovo agente per il marketplace',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['sales', 'content', 'finance', 'admin', 'dev'] },
          price_monthly: { type: 'number', default: 0 },
          tools: { type: 'array', items: { type: 'string' } },
          userId: { type: 'string' }
        },
        required: ['name', 'description', 'category', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_subscription_status',
      description: 'Verifica stato abbonamento utente',
      parameters: {
        type: 'object',
        properties: {
          telegramId: { type: 'string' },
          userId: { type: 'string' }
        },
        required: []
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_invoice',
      description: 'Crea fattura Stripe per utente',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Importo in centesimi' },
          currency: { type: 'string', default: 'eur' },
          description: { type: 'string' },
          userId: { type: 'string' },
          customerId: { type: 'string' }
        },
        required: ['amount', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'deploy_agent',
      description: 'Pubblica agente nel marketplace',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          isPublic: { type: 'boolean', default: true },
          userId: { type: 'string' }
        },
        required: ['agentId', 'userId']
      }
    }
  }
];

// Risultato esecuzione agente
export interface AgentResult {
  response: string;
  action: string;
  toolUsed?: string;
  result?: any;
  error?: string;
  nextStep?: string;
}

// Esecutore principale
export async function executeAgent(
  userMessage: string,
  userId: string,
  sessionId?: string
): Promise<AgentResult> {
  // Recupera contesto utente
  const { data: user } = await supabase
    .from('lara_users')
    .select('*, plan, tokens_used, tokens_limit')
    .eq('user_id', userId)
    .single();

  // Recupera ultime note per contesto
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('title, content_preview, tags')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Recupera memoria RAG
  const { data: memories } = await supabase
    .from('lara_memory')
    .select('key, value, category')
    .eq('user_id', userId)
    .limit(10);

  // Costruisci contesto
  const context = `
UTENTE: ${user?.name || userId}
PIANO: ${user?.plan || 'free'}
TOKEN: ${user?.tokens_used || 0}/${user?.tokens_limit || 100000}

NOTE RECENTI:
${recentNotes?.map(n => `- ${n.title}: ${n.content_preview}`).join('\n') || 'Nessuna nota'}

MEMORIA:
${memories?.map(m => `- ${m.key}: ${m.value}`).join('\n') || 'Nessuna memoria'}
`;

  // Chiama Groq con tools
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
      { role: 'user', content: userMessage }
    ],
    tools: TOOLS,
    temperature: 0.7,
    max_tokens: 2048
  });

  const message = completion.choices[0].message;

  // Se l'agente vuole chiamare un tool, eseguilo
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolResult = await executeTool(message.tool_calls[0], userId, sessionId);
    return {
      response: toolResult.response,
      action: toolResult.action,
      toolUsed: message.tool_calls[0].function.name,
      result: toolResult.result,
      nextStep: toolResult.nextStep
    };
  }

  return {
    response: message.content || 'Non ho capito la richiesta.',
    action: 'chat',
    nextStep: 'Cosa vuoi fare adesso?'
  };
}

// Esecutore tool
async function executeTool(
  toolCall: any,
  userId: string,
  sessionId?: string
): Promise<{ action: string; response: string; result?: any; nextStep?: string }> {
  const tool = toolCall.function;
  const args = JSON.parse(tool.arguments);

  switch (tool.name) {
    case 'search_obsidian': {
      const { data: notes } = await supabase
        .from('notes')
        .select('title, content_preview, tags, folder')
        .eq('user_id', userId)
        .ilike('content', `%${args.query}%`)
        .limit(args.limit || 10);

      const count = notes?.length || 0;
      return {
        action: 'search_obsidian',
        response: `Trovate ${count} note${count > 0 ? ':' : '.'}\n\n` +
          notes?.slice(0, 5).map(n => `📄 **${n.title}**\n${n.content_preview}\n`).join('\n') || 'Nessun risultato',
        result: notes,
        nextStep: count > 0 ? 'Vuoi leggere una nota specifica?' : 'Vuoi creare una nuova nota?'
      };
    }

    case 'create_note': {
      const newNote = {
        user_id: userId,
        title: args.title,
        content: args.content,
        folder: args.folder || 'root',
        tags: args.tags || [],
        content_preview: args.content?.slice(0, 200),
        word_count: args.content?.split(' ').length || 0
      };

      await supabase.from('notes').insert(newNote);

      // Aggiorna token usati
      await supabase.from('lara_users')
        .update({ tokens_used: (await getUserTokens(userId)) + args.content?.length || 0 })
        .eq('user_id', userId);

      return {
        action: 'create_note',
        response: `✅ Nota "**${args.title}**" creata!\n\nFolder: \`${args.folder || 'root'}\`\nParole: ${newNote.word_count}`,
        result: { title: args.title, folder: args.folder },
        nextStep: 'Vuoi aggiungere altro contenuto o creare un\'altra nota?'
      };
    }

    case 'get_leads': {
      const query = supabase.from('leads').select('*').eq('user_id', userId);
      if (args.status) query.eq('status', args.status);
      query.limit(args.limit || 10);
      const { data: leads } = await query;

      const count = leads?.length || 0;
      return {
        action: 'get_leads',
        response: `📊 **${count} lead** trovati${args.status ? ` (${args.status})` : ''}\n\n` +
          leads?.slice(0, 5).map(l => `👤 **${l.name}** - ${l.email}\nStatus: ${l.status}\nValore: €${l.value_potential || 0}`).join('\n\n') || 'Nessun lead',
        result: leads,
        nextStep: count > 0 ? 'Vuoi contattare qualche lead?' : 'Vuoi creare un nuovo lead?'
      };
    }

    case 'create_lead': {
      const newLead = {
        user_id: userId,
        email: args.email,
        name: args.name || args.email.split('@')[0],
        company: args.company || '',
        status: args.status || 'new',
        value_potential: args.value_potential || 0
      };

      await supabase.from('leads').insert(newLead);

      return {
        action: 'create_lead',
        response: `✅ Lead "**${newLead.name}**" creato!\n\nEmail: ${args.email}\nStatus: ${newLead.status}`,
        result: newLead,
        nextStep: 'Vuoi inviare una email di benvenuto o impostare un follow-up?'
      };
    }

    case 'generate_image': {
      // Chiama API esterna (Fal.ai o OpenRouter)
      const imageUrl = await callImageAPI(args.prompt, args.style, args.size);

      return {
        action: 'generate_image',
        response: `🎨 Immagine generata!\n\nPrompt: "${args.prompt}"\n\n![Immagine](${imageUrl})`,
        result: { url: imageUrl, prompt: args.prompt },
        nextStep: 'Vuoi generare un video da questa immagine o modificare il prompt?'
      };
    }

    case 'generate_video': {
      const videoUrl = await callVideoAPI(args.prompt, args.image_url, args.duration);

      return {
        action: 'generate_video',
        response: `🎬 Video generato!\n\nPrompt: "${args.prompt}"\n\n[Guarda video](${videoUrl})`,
        result: { url: videoUrl },
        nextStep: 'Vuoi condividere il video o generare una thumbnail?'
      };
    }

    case 'create_agent': {
      const agentData = {
        creator_id: userId,
        name: args.name,
        description: args.description,
        category: args.category,
        price_monthly: args.price_monthly || 0,
        tools_available: args.tools || [],
        version: '1.0.0',
        status: 'draft'
      };

      const { data: agent, error } = await supabase
        .from('lara_marketplace')
        .insert(agentData)
        .select()
        .single();

      if (error) {
        return { action: 'error', response: `❌ Errore: ${error.message}` };
      }

      return {
        action: 'create_agent',
        response: `🤖 Agente "**${args.name}**" creato!\n\nCategoria: ${args.category}\nPrezzo: €${args.price_monthly || 0}/mese\n\nID: \`${agent.id}\``,
        result: agent,
        nextStep: 'Vuoi pubblicarlo nel marketplace o testarlo prima?'
      };
    }

    case 'get_subscription_status': {
      const tgId = args.telegramId || userId;
      const { data: user } = await supabase
        .from('lara_users')
        .select('plan, tokens_used, tokens_limit, subscription_status')
        .eq('telegram_chat_id', tgId)
        .single();

      if (!user) {
        return { action: 'error', response: '❌ Utente non trovato' };
      }

      const percentage = Math.round((user.tokens_used / user.tokens_limit) * 100);

      return {
        action: 'get_subscription_status',
        response: `📊 **Stato Account**\n\n` +
          `Piano: **${user.plan}**\n` +
          `Token: ${user.tokens_used}/${user.tokens_limit} (${percentage}%)\n` +
          `Stato: ${user.subscription_status || 'active'}`,
        result: user,
        nextStep: percentage > 80 ? 'Vuoi fare un upgrade?' : 'Tutto nella norma!'
      };
    }

    case 'create_invoice': {
      // Simula creazione fattura (in produzione: Stripe API)
      const invoiceId = `inv_${Date.now()}`;

      await supabase.from('transactions').insert({
        user_id: userId,
        amount: args.amount / 100,
        currency: args.currency || 'eur',
        status: 'pending',
        product_type: 'one_time',
        metadata: { description: args.description, invoice_id: invoiceId }
      });

      return {
        action: 'create_invoice',
        response: `📄 Fattura creata!\n\nImporto: €${(args.amount / 100).toFixed(2)}\nID: \`${invoiceId}\`\n\nDescrizione: ${args.description || 'Nessuna'}`,
        result: { invoiceId, amount: args.amount },
        nextStep: 'Vuoi inviare la fattura via email o scaricarla in PDF?'
      };
    }

    case 'deploy_agent': {
      await supabase.from('lara_marketplace')
        .update({ status: 'published' })
        .eq('id', args.agentId);

      return {
        action: 'deploy_agent',
        response: `🚀 Agente pubblicato nel marketplace!\n\nOra è visibile a tutti gli utenti Aethersy.`,
        result: { agentId: args.agentId, isPublic: true },
        nextStep: 'Vuoi promuovere l\'agente sui social o creare una landing page?'
      };
    }

    default:
      return {
        action: 'error',
        response: `❌ Tool "${tool.name}" non implementato`,
        nextStep: 'Prova un altro comando o contatta il supporto.'
      };
  }
}

// Helper per API immagini
async function callImageAPI(prompt: string, style?: string, size?: string): Promise<string> {
  // Placeholder - in produzione chiama Fal.ai / Replicate
  const seed = Math.random().toString(36).slice(2);
  return `https://image.aethersy.com/gen/${seed}?prompt=${encodeURIComponent(prompt)}&style=${style || 'realistic'}`;
}

// Helper per API video
async function callVideoAPI(prompt: string, imageUrl?: string, duration?: number): Promise<string> {
  // Placeholder - in produzione chiama Runway / Pika / SVD
  const seed = Math.random().toString(36).slice(2);
  return `https://video.aethersy.com/gen/${seed}?prompt=${encodeURIComponent(prompt)}&duration=${duration || 4}`;
}

// Helper per token usati
async function getUserTokens(userId: string): Promise<number> {
  const { data } = await supabase
    .from('lara_users')
    .select('tokens_used')
    .eq('user_id', userId)
    .single();
  return data?.tokens_used || 0;
}
