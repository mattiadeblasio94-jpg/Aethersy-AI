'use client';

import { useEffect, useState } from 'react';
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
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/marketplace/list');
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

  const categories = ['all', 'sales', 'content', 'finance', 'admin', 'dev', 'marketing'];

  const filteredAgents = filter === 'all'
    ? agents
    : agents.filter(a => a.category === filter);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Marketplace Agenti AI
        </h1>
        <p className="text-gray-500 mt-2">Scopri e acquista agenti AI per il tuo business</p>
      </motion.header>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{agent.name}</h3>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {agent.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold">
                    {agent.priceMonthly === 0 ? 'Gratis' : `€${agent.priceMonthly / 100}`}
                  </div>
                  <div className="text-xs text-gray-500">/mese</div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span className="text-yellow-400">{agent.ratingAvg.toFixed(1)}</span>
                </div>
                <div>📦 {agent.totalSales} vendite</div>
              </div>

              <button
                onClick={() => alert(`Acquisto di ${agent.name} - Da implementare con Stripe`)}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
              >
                {agent.priceMonthly === 0 ? 'Ottieni' : 'Acquista'}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {filteredAgents.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-500">
          Nessun agente trovato in questa categoria
        </div>
      )}
    </div>
  );
}
