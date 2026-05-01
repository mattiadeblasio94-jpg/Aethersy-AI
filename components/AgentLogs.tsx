'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

interface AgentLog {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  phase: 'think' | 'plan' | 'act' | 'verify';
  status: 'pending' | 'running' | 'completed' | 'error';
  input?: any;
  output?: any;
  duration?: number;
  timestamp: string;
}

interface AgentLogsProps {
  limit?: number;
  showFilters?: boolean;
}

export default function AgentLogs({ limit = 50, showFilters = true }: AgentLogsProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Carica log iniziali
    fetchLogs();

    // Ascolta eventi realtime
    socket.on('agent-start', (data) => {
      const newLog: AgentLog = {
        id: data.sessionId,
        sessionId: data.sessionId,
        userId: data.userId,
        action: data.prompt,
        phase: 'think',
        status: 'pending',
        timestamp: data.timestamp
      };
      setLogs(prev => [newLog, ...prev].slice(0, limit));
    });

    socket.on('terminal-output', (data) => {
      setLogs(prev => prev.map(log =>
        log.sessionId === data.sessionId
          ? { ...log, phase: 'act' as const, status: 'running' as const, output: data.content }
          : log
      ));
    });

    socket.on('agent-complete', (data) => {
      setLogs(prev => prev.map(log =>
        log.sessionId === data.sessionId
          ? { ...log, phase: 'verify' as const, status: data.success ? 'completed' : 'error' }
          : log
      ));
    });

    return () => {
      socket.off('agent-start');
      socket.off('terminal-output');
      socket.off('agent-complete');
    };
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch('/api/logs?action=recent&limit=' + limit);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'think': return '💭';
      case 'plan': return '📋';
      case 'act': return '⚡';
      case 'verify': return '✅';
      default: return '📝';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">📋 Agent Activity Logs</h3>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
          >
            🔄 Refresh
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
            />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
            >
              <option value="all">Tutti</option>
              <option value="running">In corso</option>
              <option value="completed">Completati</option>
              <option value="error">Errori</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              Auto-scroll
            </label>
          </div>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nessun log trovato
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                  log.status === 'error' ? 'bg-red-900/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(log.status)}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getPhaseIcon(log.phase)}</span>
                      <span className="font-mono text-sm text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                        log.status === 'error' ? 'bg-red-900/50 text-red-400' :
                        log.status === 'running' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <p className="text-white font-medium truncate">{log.action}</p>

                    {log.output && (
                      <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-gray-400 overflow-auto max-h-24">
                        {String(log.output).slice(0, 500)}
                      </pre>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Session: {log.sessionId.slice(0, 12)}...</span>
                      {log.duration && <span>⏱️ {log.duration}ms</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
