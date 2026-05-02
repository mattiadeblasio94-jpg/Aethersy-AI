'use client';

import { useState } from 'react';
import { LiveTerminal } from '../components/LiveTerminal';
import AgentLogs from '../components/AgentLogs';
import KnowledgeGraph from '../components/KnowledgeGraph';
import { motion } from 'framer-motion';

export default function TerminalPage() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs' | 'knowledge'>('terminal');

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Aethersy OS - Torre di Controllo
        </h1>
        <p className="text-gray-500 mt-2">Monitoraggio in tempo reale degli agenti AI</p>
      </motion.header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'terminal'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Terminale
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Activity Log
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'knowledge'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Knowledge Graph
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveTerminal height={600} />
            </div>
            <div>
              <AgentLogs limit={20} showFilters={false} />
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <AgentLogs limit={100} />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeGraph notes={[]} height={600} />
        )}
      </motion.div>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-600 text-sm">
        <p>Aethersy OS v1.0 - Azienda Autonoma AI</p>
        <p className="text-xs mt-1">WebSocket: {process.env.NEXT_PUBLIC_WS_URL || 'localhost:3001'}</p>
      </footer>
    </div>
  );
}
