/**
 * Credit & Token Management System - In-Memory Version
 * Traccia consumi e gestisce crediti (senza database per deployment semplice)
 */

// ============================================
// CONFIGURAZIONE PIANI E LIMITI
// ============================================

export const PLANS = {
  free: {
    name: 'Free',
    monthlyCredits: 10,
    tokenLimit: 50000,
    dailyRequests: 20,
    maxTokensPerRequest: 4096,
    models: ['groq:llama-3.1-8b-instant'],
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
    monthlyCredits: -1,
    tokenLimit: -1,
    dailyRequests: -1,
    maxTokensPerRequest: 128000,
    models: 'all',
    skills: 'all',
    priority: true,
    price: 499
  }
};

// ============================================
// TOKEN ESTIMATION
// ============================================

export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

export function estimateCost(model, tokens) {
  const prices = {
    'groq:llama-3.1-8b-instant': 0.0000001,
    'groq:llama-3.3-70b-versatile': 0.0000005,
    'openrouter:qwen/qwen-2.5-72b-instruct': 0.0000008,
    'anthropic:claude-3-haiku': 0.000001,
    'anthropic:claude-3-sonnet': 0.000003,
    'default': 0.000001
  };
  const price = prices[model] || prices.default;
  return tokens * price;
}

// ============================================
// CREDIT FUNCTIONS (In-Memory)
// ============================================

export async function checkCredits(userId, action = 'chat', tokens = 1000) {
  // Always allow in this simple version
  return {
    allowed: true,
    remaining: 999,
    limit: 1000
  };
}

export async function deductCredits(userId, tokens, model = 'default') {
  // No-op in this version
  return {
    success: true,
    deducted: tokens,
    remaining: 999
  };
}

export async function getUsageStats(userId) {
  return {
    plan: 'free',
    usedToday: 0,
    dailyLimit: 20,
    creditsUsed: 0,
    creditsRemaining: 10
  };
}

export async function getUserPlan(userId) {
  return 'free';
}

export async function upgradeUserPlan(userId, newPlan) {
  return { success: true, plan: newPlan };
}
