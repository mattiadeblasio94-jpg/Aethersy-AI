/**
 * Aethersy Gateway Server
 * Server WebSocket standalone per il gateway
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Crea server HTTP
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === '/api/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        io.emit(data.type, data.data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// Crea server Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Gestione connessioni
io.on('connection', (socket) => {
  console.log(`🔌 Client connesso: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnesso: ${socket.id}`);
  });

  // Join a sessione specifica
  socket.on('join-session', (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });

  // Leave sessione
  socket.on('leave-session', (sessionId: string) => {
    socket.leave(sessionId);
  });

  // Ping per mantenere connessione
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Avvia server
const PORT = process.env.WS_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(``);
  console.log(`╔════════════════════════════════════════════════════╗`);
  console.log(`║     🌉 AETHERSY GATEWAY SERVER                     ║`);
  console.log(`╠════════════════════════════════════════════════════╣`);
  console.log(`║  WebSocket:  ws://localhost:${PORT}                   ║`);
  console.log(`║  Health:     http://localhost:${PORT}/health          ║`);
  console.log(`║  Supabase:   ${process.env.SUPABASE_URL?.slice(0, 25)}...`);
  console.log(`╚════════════════════════════════════════════════════╝`);
  console.log(``);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { io };
