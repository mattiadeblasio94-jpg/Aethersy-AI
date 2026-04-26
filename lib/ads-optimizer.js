import { getRevenueForPeriod } from './stripe';

// Simulated campaign store (replace with real Google/Meta API calls)
const campaigns = new Map();

export function seedCampaign(id, data) {
  campaigns.set(id, { id, ...data });
}

export function getCampaigns() {
  return [...campaigns.values()];
}

export async function calculateROAS(campaignId, adSpend) {
  const revenue = await getRevenueForPeriod(30);
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  return { revenue, adSpend, roas: parseFloat(roas.toFixed(2)) };
}

export async function getSystemStatus() {
  const campaigns = getCampaigns();
  const revenue = await getRevenueForPeriod(30);
  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const roas = totalSpend > 0 ? (revenue / totalSpend).toFixed(2) : 'N/A';
  return { campaigns: campaigns.length, revenue, totalSpend, roas };
}

export function scaleBudget(campaignId, percent) {
  const c = campaigns.get(campaignId);
  if (!c) return null;
  c.budget = parseFloat((c.budget * (1 + percent / 100)).toFixed(2));
  campaigns.set(campaignId, c);
  return c;
}

export function stopCampaign(campaignId) {
  const c = campaigns.get(campaignId);
  if (!c) return null;
  c.active = false;
  campaigns.set(campaignId, c);
  return c;
}
