/**
 * USAGE STATS API - Statistiche consumo token e crediti
 */

import { getUsageStats, PLANS } from '../../../lib/credit-system';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId richiesto' });
  }

  try {
    const stats = await getUsageStats(userId);

    // Aggiungi info piano
    const planInfo = PLANS[stats.plan] || PLANS.free;
    stats.planInfo = {
      name: planInfo.name,
      price: planInfo.price,
      monthlyCredits: planInfo.monthlyCredits,
      tokenLimit: planInfo.tokenLimit,
      dailyRequests: planInfo.dailyRequests
    };

    // Calcola percentuali utilizzo
    if (planInfo.monthlyCredits >= 0) {
      stats.creditsUsedPercent = ((planInfo.monthlyCredits - stats.creditsRemaining) / planInfo.monthlyCredits * 100).toFixed(1);
    }
    if (planInfo.tokenLimit >= 0) {
      stats.tokensUsedPercent = ((planInfo.tokenLimit - stats.remainingTokens) / planInfo.tokenLimit * 100).toFixed(1);
    }
    stats.requestsTodayPercent = (stats.requestsToday / planInfo.dailyRequests * 100).toFixed(1);

    return res.json({ success: true, ...stats });

  } catch (error) {
    console.error('Usage stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
