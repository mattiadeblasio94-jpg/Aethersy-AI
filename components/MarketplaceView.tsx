'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  priceLifetime?: number;
  ratingAvg: number;
  totalSales: number;
  creatorId: string;
  toolsAvailable: string[];
}

interface MarketplaceViewProps {
  userId?: string;
  isAdmin?: boolean;
}

export default function MarketplaceView({ userId, isAdmin }: MarketplaceViewProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  const categories = ['all', 'sales', 'content', 'finance', 'admin', 'dev', 'marketing'];

  useEffect(() => {
    fetchAgents();
    fetchPurchased();
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/marketplace/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPurchased() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/marketplace/purchased?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPurchased(new Set(data.agentIds || []));
      }
    } catch (error) {
      console.error('Failed to fetch purchased:', error);
    }
  }

  async function handlePurchase(agent: Agent, type: 'subscription' | 'lifetime') {
    if (!userId) {
      alert('Devi effettuare il login per acquistare');
      return;
    }

    try {
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          type
        })
      });

      if (res.ok) {
        setPurchased(prev => new Set(prev).add(agent.id));
        alert('Acquisto completato!');
      } else {
        const error = await res.json();
        alert('Errore: ' + error.error);
      }
    } catch (error) {
      alert('Errore durante l\'acquisto');
    }
  }

  const filteredAgents = agents.filter(agent => {
    if (filter !== 'all' && agent.category !== filter) return false;
    if (search && !agent.name.toLowerCase().includes(search.toLowerCase()) &&
        !agent.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">🤖 AI Agent Marketplace</h3>
          <span className="text-sm text-gray-400">{agents.length} agenti</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Cerca agenti..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Tutte le categorie' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-800 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-full mb-1" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </div>
          ))
        ) : filteredAgents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nessun agente trovato
          </div>
        ) : (
          filteredAgents.map(agent => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-white">{agent.name}</h4>
                  <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-700 rounded">
                    {agent.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  <span>⭐</span>
                  <span>{agent.ratingAvg.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {agent.description}
              </p>

              {agent.toolsAvailable.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.toolsAvailable.slice(0, 3).map(tool => (
                    <span key={tool} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                      {tool}
                    </span>
                  ))}
                  {agent.toolsAvailable.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{agent.toolsAvailable.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  {agent.priceMonthly === 0 ? (
                    <span className="text-green-400 font-medium">Gratuito</span>
                  ) : (
                    <div>
                      <span className="text-white font-medium">€{(agent.priceMonthly / 100).toFixed(2)}</span>
                      <span className="text-xs text-gray-400">/mese</span>
                      {agent.priceLifetime && (
                        <div className="text-xs text-gray-500">
                          €{(agent.priceLifetime / 100).toFixed(2)} lifetime
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {purchased.has(agent.id) ? (
                  <span className="px-3 py-1.5 bg-green-900/50 text-green-400 rounded text-sm font-medium">
                    Acquistato
                  </span>
                ) : (
                  <button
                    onClick={() => handlePurchase(agent, agent.priceLifetime ? 'lifetime' : 'subscription')}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-black rounded text-sm font-medium transition-colors"
                  >
                    Acquista
                  </button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <span>{agent.totalSales} acquisti</span>
                <span>ID: {agent.id.slice(0, 8)}...</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isAdmin && (
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => window.location.href = '/agents?action=create'}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded font-medium transition-colors"
          >
            ➕ Crea Nuovo Agente
          </button>
        </div>
      )}
    </div>
  );
}
