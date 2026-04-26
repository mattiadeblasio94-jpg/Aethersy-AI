import Anthropic from '@anthropic-ai/sdk';
import { TEMPLATE_CATEGORIES, TEMPLATES, getTemplatesByCategory, searchTemplates, getTemplate } from '../../lib/templates';
import { Redis } from '@upstash/redis';

export const config = { api: { bodyParser: true, responseLimit: false } };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// Verify Lara/Telegram authorization
async function verifyLaraAuth(token) {
  if (!token) return false;
  const expected = process.env.LARA_TERMINAL_TOKEN || 'lara-secret-token';
  return token === expected;
}

async function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url.startsWith('http')) return null;
  return new Redis({ url, token });
}

// ── Mode system prompts ───────────────────────────────────────────────────────

const MODE_SYSTEM = {
  generate: (lang) => `You are an elite software engineer — the best in the world at ${lang}.
Build COMPLETE, production-grade code. Rules:
- Write COMPLETE runnable code, never partial snippets
- All imports, error handling, types included
- Comment only non-obvious logic (why, not what)
- End with: ## Setup\n\`\`\`bash\n[install commands]\n\`\`\`
- Be verbose in code quality, concise in explanations`,

  debug: (lang) => `You are an expert debugger for ${lang}. Analyze code and find ALL bugs.

FORMAT EXACTLY:
## 🐛 Bugs Found
1. **[Bug name]**: what's wrong and why it breaks

## ✅ Fixed Code
\`\`\`${lang}
[complete corrected code]
\`\`\`

## 💡 Prevention Tips
[2-3 brief tips]`,

  explain: (lang) => `You are a brilliant teacher. Explain ${lang} code so a senior dev instantly understands it.

FORMAT:
## 🎯 What it does
[1-2 sentence summary]

## 🔍 Step-by-step breakdown
[walk through each key section]

## 💡 Key patterns & techniques
[highlight notable design decisions]

## ⚠️ Gotchas & edge cases
[anything surprising]`,

  refactor: (lang) => `You are a senior architect specializing in ${lang} code quality.

Improve: readability, naming, DRY, modern patterns, types/safety.
FORMAT:
## Changes Made
- [bullet: what changed and WHY]

## Refactored Code
\`\`\`${lang}
[complete refactored version]
\`\`\``,

  test: (lang) => `You are a QA expert. Write comprehensive tests for ${lang}.

Include: happy path, edge cases, error handling, mocks where needed.
Use the standard testing framework for ${lang}.
Return a COMPLETE test file ready to run.`,

  optimize: (lang) => `You are a performance engineer specializing in ${lang}.

FORMAT:
## 🔍 Performance Issues
[what's inefficient: O(n²) loops, memory leaks, blocking calls, etc.]

## ⚡ Optimized Code
\`\`\`${lang}
[complete optimized version]
\`\`\`

## 📊 Improvements Summary
[quantify: O(n²)→O(n log n), N+1→1 query, etc.]`,

  document: (lang) => `You are a technical documentation expert for ${lang}.

Add to the code:
- JSDoc/docstrings for ALL functions and classes
- Inline comments for complex/non-obvious logic
- Module-level overview comment
Return ONLY the fully documented code.`,

  review: (lang) => `You are a senior code reviewer at a top tech company reviewing ${lang} code.

FORMAT:
## ✅ Strengths
## ⚠️ Issues
| Severity | Issue | Location | Fix |
|----------|-------|----------|-----|
## 🔒 Security Concerns
## 🚀 Performance Notes
## 📝 Top Recommendations
## Overall Score: X/10 — [one sentence verdict]`,

  complete: (lang) => `You are an AI pair programmer. Complete or extend the provided ${lang} code.
Seamlessly continue from where it left off. Match the existing style exactly.
Return the FULL completed code, not just the additions.`,
};

// ── GET: template metadata ────────────────────────────────────────────────────

function handleGet(req, res) {
  const { action, category, q } = req.query;
  if (action === 'categories') return res.json({ categories: TEMPLATE_CATEGORIES });
  if (action === 'list') return res.json({ templates: category ? getTemplatesByCategory(category) : TEMPLATES.slice(0, 60) });
  if (action === 'search') return res.json({ templates: searchTemplates(q || '').slice(0, 40) });
  return res.json({ categories: TEMPLATE_CATEGORIES, count: TEMPLATES.length });
}

// ── POST: streaming generation ────────────────────────────────────────────────

async function handlePost(req, res) {
  const {
    instruction = '',
    codeContext = '',
    language = 'javascript',
    mode = 'generate',
    templateId,
    maxTokens = 8000,
  } = req.body || {};

  let finalInstruction = instruction.trim();

  // Template override
  if (templateId) {
    const tpl = getTemplate(templateId);
    if (tpl) finalInstruction = finalInstruction ? `${tpl.prompt}\n\nDettagli extra: ${finalInstruction}` : tpl.prompt;
  }

  if (!finalInstruction) return res.status(400).json({ error: 'Inserisci un\'istruzione' });

  const systemFn = MODE_SYSTEM[mode] || MODE_SYSTEM.generate;
  const system = systemFn(language);

  const userContent = codeContext.trim()
    ? `${finalInstruction}\n\n\`\`\`${language}\n${codeContext.trim()}\n\`\`\``
    : finalInstruction;

  // Set up SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(maxTokens, 8000),
      system,
      messages: [{ role: 'user', content: userContent }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ t: event.delta.text })}\n\n`);
      }
    }

    const final = await stream.finalMessage();
    res.write(`data: ${JSON.stringify({ done: true, tokens: final.usage?.output_tokens })}\n\n`);
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
}

// POST: Trigger execution from Lara (autonomous mode)
async function handleLaraExecute(req, res) {
  const { action, instruction, language = 'javascript', mode = 'generate', auth } = req.body || {};

  // Verify authorization
  if (!await verifyLaraAuth(auth)) {
    return res.status(403).json({ error: 'Non autorizzato. Token Lara richiesto.' });
  }

  if (!instruction) {
    return res.status(400).json({ error: 'Istruzione richiesta' });
  }

  try {
    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Use same generation logic as normal terminal
    const systemFn = MODE_SYSTEM[mode] || MODE_SYSTEM.generate;
    const system = systemFn(language);

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: instruction }],
    });

    let tokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ t: event.delta.text, source: 'lara' })}\n\n`);
      }
    }

    const final = await stream.finalMessage();
    tokens = final.usage?.output_tokens || 0;

    res.write(`data: ${JSON.stringify({ done: true, tokens, source: 'lara' })}\n\n`);
    res.end();

    // Store execution in Redis for history
    const r = await getRedis();
    if (r) {
      await r.lpush('terminal:lara:executions', JSON.stringify({
        instruction,
        language,
        mode,
        tokens,
        timestamp: Date.now(),
      }));
      await r.ltrim('terminal:lara:executions', 0, 49); // Keep last 50
    }

  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message, source: 'lara' })}\n\n`);
    res.end();
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') {
    // Check if this is a Lara execution request
    const isLara = req.query.lara === 'true' || req.body?.lara === true || req.body?.auth;
    if (isLara) return handleLaraExecute(req, res);
    return handlePost(req, res);
  }
  res.status(405).end();
}
