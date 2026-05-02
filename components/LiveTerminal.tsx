'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLine {
  id: string;
  content: string;
  type: 'stdout' | 'stderr' | 'system';
  timestamp: Date;
}

interface LiveTerminalProps {
  wsUrl?: string;
  height?: number;
  title?: string;
}

export function LiveTerminal({ wsUrl, height = 500, title = 'Live Terminal' }: LiveTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    const socket: Socket = io(wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('terminal-output', (data: Omit<TerminalLine, 'id' | 'timestamp'>) => {
      const newLine: TerminalLine = {
        id: Math.random().toString(36).slice(2),
        ...data,
        timestamp: new Date()
      };
      setLines(prev => [...prev.slice(-99), newLine]);
    });

    socket.on('agent-action', (data: any) => {
      const newLine: TerminalLine = {
        id: Math.random().toString(36).slice(2),
        content: `[${data.type}] ${data.content}`,
        type: 'system',
        timestamp: new Date()
      };
      setLines(prev => [...prev.slice(-99), newLine]);
    });

    return () => { socket.disconnect(); };
  }, [wsUrl]);

  const handleSend = () => {
    if (!input.trim()) return;
    // Inviare comando al server via WebSocket
    // Implementare quando il bridge supporta comandi in entrata
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/50 backdrop-blur border border-gray-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {connected ? '● LIVE' : '● DISCONNECTED'}
        </div>
      </div>

      {/* Output */}
      <div
        className="p-4 font-mono text-sm overflow-y-auto"
        style={{ height }}
      >
        <AnimatePresence>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`terminal-line mb-1 ${
                line.type === 'stdout' ? 'text-blue-400' :
                line.type === 'stderr' ? 'text-red-400' :
                'text-purple-400'
              }`}
            >
              <span className="text-gray-600 mr-2">
                {line.timestamp.toLocaleTimeString()}
              </span>
              <span>{line.content}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {lines.length === 0 && (
          <div className="text-gray-600 text-center py-20">
            In attesa di comandi...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-3 flex gap-2">
        <span className="text-green-400 font-mono">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Esegui comando..."
          className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
        />
      </div>
    </motion.div>
  );
}
