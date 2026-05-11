/**
 * Credit & Token Management System
 * Traccia consumi, gestisce crediti e applica limiti per piano
 * Usage: import { checkCredits, deductCredits, getUsageStats } from '@/lib/credit-system'
 */

import { kv } from '@vercel/kv';

// ============================================
// CONFIGURAZIONE PIANI E LIMITI
// ============================================

export const PLANS = {
  free: {
    name: 'Free',
    monthlyCredits: 10, // $ di crediti inclusi
    tokenLimit: 50000, // token / mese
    dailyRequests: 20,
    maxTokensPerRequest: 4096,
    models: ['openrouter:qwen/qwen-2.5-72b-instruct', 'groq:llama-3.1-8b-instant'],
    skills: ['web_search', 'email_writer', 'translator'],
    price: 0
  },
  pro: {
    name: 'Pro',
    monthlyCredits: 50,
    tokenLimit: 500000,
    dailyRequests: 200,
    maxTokensPerRequest: 16384,
    models: 'all',
    skills: 'all',
    price: 29
  },
  business: {
    name: 'Business',
    monthlyCredits: 200,
    tokenLimit: 2000000,
    dailyRequests: 1000,
    maxTokensPerRequest: 32768,
    models: 'all',
    skills: 'all',
    priority: true,
    price: 99
  },
  enterprise: {
    name: 'Enterprise',
    monthlyCredits: -1, // illimitato
    tokenLimit: -1,
    dailyRequests: -1,
    maxTokensPerRequest: 128000,
    models: 'all',
    skills: 'all',
    priority: true,
    dedicated: true,
    price: 499
  }
};

// ============================================
// PREZZI TOKEN PER MODELLO ($ per 1K token)
// ============================================

export const MODEL_PRICING = {
  // HuggingFace
  'meta-llama/Meta-Llama-3.1-70B-Instruct': { input: 0.0007, output: 0.0007 },
  'mistralai/Mixtral-8x7B-Instruct-v0.1': { input: 0.0005, output: 0.0005 },
  'Qwen/Qwen2.5-72B-Instruct': { input: 0.0008, output: 0.0008 },
  'deepseek-ai/DeepSeek-V3': { input: 0.0006, output: 0.0006 },
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  // Anthropic
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-haiku-20240307': { input: 0.00025, output: 0.00125 },
  // Groq
  'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
  // OpenRouter
  'qwen/qwen-2.5-72b-instruct': { input: 0.0007, output: 0.0007 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.0007, output: 0.0007 },
  'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
};

// ============================================
// FUNZIONI PRINCIPALI
// ============================================

/**
 * Verifica se l'utente ha crediti sufficienti per una richiesta
 * @param {string} userId - ID utente
 * @param {string} model - Modello richiesto
 * @param {number} estimatedTokens - Token stimati
 */
export async function checkCredits(userId, model, estimatedTokens = 2000) {
  try {
    // Carica dati utente da KV (cache di Supabase/MongoDB)
    const userKey = `user:${userId}`;
    const userData = await kv.hgetall(userKey);

    if (!userData) {
      // Utente non trovato, usa default free
      return {
        allowed: true,
        plan: 'free',
        credits: 10,
        message: 'Utente nuovo - piano Free'
      };
    }

    const plan = userData.plan || 'free';
    const planConfig = PLANS[plan];
    const remainingCredits = parseFloat(userData.credits || planConfig.monthlyCredits);
    const remainingTokens = parseInt(userData.remainingTokens || planConfig.tokenLimit);

    // Calcola costo stimato
    const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
    const estimatedCost = (estimatedTokens / 1000) * (pricing.input + pricing.output);

    // Verifica limiti
    const checks = {
      hasCredits: planConfig.monthlyCredits < 0 || remainingCredits >= estimatedCost,
      hasTokens: planConfig.tokenLimit < 0 || remainingTokens >= estimatedTokens,
      modelAllowed: planConfig.models === 'all' || planConfig.models.includes(model),
    };

    const allowed = Object.values(checks).every(v => v);

    return {
      allowed,
      plan,
      credits: remainingCredits,
      remainingTokens,
      estimatedCost,
      checks,
      message: allowed ? 'OK' : 'Limiti raggiunti'
    };
  } catch (error) {
    console.error('Credit check error:', error);
    // Fail-open: permetti in caso di errore
    return { allowed: true, plan: 'free', credits: 10, message: 'Error - fallback' };
  }
}

/**
 * Scala crediti dopo una chiamata LLM completata
 * @param {string} userId - ID utente
 * @param {string} model - Modello usato
 * @param {object} usage - { prompt_tokens, completion_tokens, total_tokens }
 */
export async function deductCredits(userId, model, usage) {
  try {
    const userKey = `user:${userId}`;
    const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };

    const inputCost = (usage.prompt_tokens / 1000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    // Decrementa crediti e token
    await kv.hincrbyfloat(userKey, 'credits', -totalCost);
    await kv.hincrby(userKey, 'remainingTokens', -usage.total_tokens);
    await kv.hincrby(userKey, 'totalTokensUsed', usage.total_tokens);

    // Log transazione
    const txKey = `tx:${userId}:${Date.now()}`;
    await kv.set(txKey, {
      type: 'llm_call',
      model,
      tokens: usage,
      cost: totalCost,
      timestamp: Date.now()
    });
    await kv.expire(txKey, 86400 * 30); // 30 giorni

    return {
      success: true,
      cost: totalCost,
      tokens: usage.total_tokens
    };
  } catch (error) {
    console.error('Deduct credits error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Scala crediti per esecuzione skill
 * @param {string} userId - ID utente
 * @param {string} skillId - ID skill
 * @param {number} creditCost - Costo in crediti
 */
export async function deductSkillCredits(userId, skillId, creditCost = 1) {
  try {
    const userKey = `user:${userId}`;

    await kv.hincrbyfloat(userKey, 'credits', -creditCost);

    // Log transazione
    const txKey = `tx:${userId}:${Date.now()}`;
    await kv.set(txKey, {
      type: 'skill_execution',
      skill: skillId,
      cost: creditCost,
      timestamp: Date.now()
    });
    await kv.expire(txKey, 86400 * 30);

    return { success: true, cost: creditCost };
  } catch (error) {
    console.error('Deduct skill credits error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ottiene statistiche di utilizzo per dashboard
 * @param {string} userId - ID utente
 */
export async function getUsageStats(userId) {
  try {
    const userKey = `user:${userId}`;
    const userData = await kv.hgetall(userKey);

    if (!userData) {
      return {
        plan: 'free',
        creditsRemaining: 10,
        creditsUsed: 0,
        tokensUsed: 0,
        requestsToday: 0,
        requestsTotal: 0
      };
    }

    // Conta richieste oggi
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `requests:${userId}:${today}`;
    const requestsToday = await kv.get(todayKey) || 0;

    return {
      plan: userData.plan || 'free',
      creditsRemaining: parseFloat(userData.credits || 10),
      creditsUsed: parseFloat(userData.creditsUsed || 0),
      tokensUsed: parseInt(userData.totalTokensUsed || 0),
      remainingTokens: parseInt(userData.remainingTokens || 50000),
      requestsToday: parseInt(requestsToday),
      requestsTotal: parseInt(userData.totalRequests || 0),
      lastUsage: userData.lastUsage ? new Date(userData.lastUsage) : null
    };
  } catch (error) {
    console.error('Usage stats error:', error);
    return { error: error.message };
  }
}

/**
 * Incrementa contatore richieste giornaliere
 */
export async function incrementDailyRequests(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `requests:${userId}:${today}`;

    const count = await kv.incr(todayKey);
    await kv.expire(todayKey, 86400); // 24 ore

    // Aggiorna totale
    const userKey = `user:${userId}`;
    await kv.hincrby(userKey, 'totalRequests', 1);
    await kv.hset(userKey, 'lastUsage', Date.now());

    return { count };
  } catch (error) {
    console.error('Increment requests error:', error);
    return { count: 0 };
  }
}

/**
 * Resetta crediti mensili (da chiamare con cron job)
 */
export async function resetMonthlyCredits(userId, plan = 'free') {
  try {
    const userKey = `user:${userId}`;
    const planConfig = PLANS[plan];

    await kv.hset(userKey, {
      credits: planConfig.monthlyCredits,
      remainingTokens: planConfig.tokenLimit,
      creditsUsed: 0,
      lastReset: Date.now()
    });

    return { success: true, credits: planConfig.monthlyCredits };
  } catch (error) {
    console.error('Reset credits error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Assegna crediti bonus (promo, referral, etc.)
 */
export async function addBonusCredits(userId, amount, reason = 'bonus') {
  try {
    const userKey = `user:${userId}`;

    await kv.hincrbyfloat(userKey, 'credits', amount);

    // Log bonus
    const bonusKey = `bonus:${userId}:${Date.now()}`;
    await kv.set(bonusKey, {
      type: 'bonus',
      amount,
      reason,
      timestamp: Date.now()
    });

    return { success: true, newBalance: amount };
  } catch (error) {
    console.error('Add bonus error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica se una skill è permessa per il piano utente
 */
export async function checkSkillAccess(userId, skillId) {
  try {
    const userKey = `user:${userId}`;
    const userData = await kv.hgetall(userKey);
    const plan = userData.plan || 'free';
    const planConfig = PLANS[plan];

    if (planConfig.skills === 'all') {
      return { allowed: true, plan };
    }

    const allowed = planConfig.skills.includes(skillId);
    return { allowed, plan, message: allowed ? 'OK' : `Skill non inclusa nel piano ${plan}` };
  } catch (error) {
    console.error('Skill access error:', error);
    return { allowed: true, plan: 'free' }; // Fail-open
  }
}

/**
 * Middleware per API - verifica crediti prima di eseguire
 * Usage: await withCreditCheck(req, res, async () => { ... })
 */
export async function withCreditCheck(req, res, handler, options = {}) {
  const { userId, model, estimatedTokens = 2000 } = options;

  if (!userId) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  const check = await checkCredits(userId, model, estimatedTokens);

  if (!check.allowed) {
    return res.status(402).json({
      error: 'Crediti insufficienti',
      details: check,
      upgrade: 'https://aethersy.com/pricing'
    });
  }

  // Esegui handler
  return handler();
}

/**
 * Calcola costo per upgrade/downgrade piano
 */
export function calculateProration(currentPlan, newPlan, daysUsed) {
  const current = PLANS[currentPlan];
  const next = PLANS[newPlan];
  const daysInMonth = 30;

  if (next.price <= current.price) {
    return { amount: 0, message: 'Downgrade - nessun addebito' };
  }

  const priceDiff = next.price - current.price;
  const proration = (priceDiff / daysInMonth) * (daysInMonth - daysUsed);

  return {
    amount: Math.round(proration * 100) / 100,
    message: `Proration per ${daysInMonth - daysUsed} giorni`
  };
}
