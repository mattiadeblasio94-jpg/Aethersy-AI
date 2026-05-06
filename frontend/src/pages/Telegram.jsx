import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Bot, Send, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Telegram() {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState("");
  const [text, setText] = useState("");

  const loadStatus = () => api.get("/telegram/status").then((r) => setStatus(r.data));
  const loadMessages = () => api.get("/telegram/messages").then((r) => setMessages(r.data));

  useEffect(() => {
    loadStatus(); loadMessages();
    const id = setInterval(() => { loadMessages(); }, 5000);
    return () => clearInterval(id);
  }, []);

  const send = async () => {
    if (!chatId || !text) { toast.error("chat_id and text required"); return; }
    try {
      await api.post("/telegram/send", { chat_id: parseInt(chatId), text });
      toast.success("Message sent");
      setText(""); loadMessages();
    } catch (e) { toast.error("Send failed"); }
  };

  return (
    <div className="p-6 md:p-8" data-testid="telegram-page">
      <div className="mb-6">
        <div className="e360-overline text-cyan-400">Telegram · Lara</div>
        <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Lara, in your pocket.</h1>
        <p className="text-zinc-500 mt-1 text-sm">Lara — your Aethersy AI co-founder — replies to any Telegram DM.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="e360-card p-6 lg:col-span-1" data-testid="telegram-status-card">
          <div className="flex items-center justify-between">
            <div className="e360-overline">Status</div>
            <button onClick={loadStatus} className="text-zinc-500 hover:text-white"><RefreshCw className="w-3.5 h-3.5"/></button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {status?.ok ? (
              <>
                <div className="w-3 h-3 rounded-full bg-emerald-400 pulse-glow"/>
                <div>
                  <div className="font-bold" style={{fontFamily:'Cabinet Grotesk'}}>Online</div>
                  <div className="text-xs text-zinc-500">@{status?.info?.username}</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-red-400"/>
                <div className="font-bold">Offline</div>
              </>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              {status?.running ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/> : <XCircle className="w-3.5 h-3.5 text-red-400"/>}
              Polling: {status?.running ? "active" : "stopped"}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
              Persona: Lara · Claude Sonnet 4.5
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
              Logs: persisted to MongoDB
            </div>
          </div>
        </div>

        <div className="e360-card p-6 lg:col-span-2">
          <div className="e360-overline mb-3">Send a message</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={chatId} onChange={(e)=>setChatId(e.target.value)} placeholder="Chat ID (e.g. 123456789)" className="e360-input sm:w-56" data-testid="telegram-chatid-input"/>
            <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Message text..." className="e360-input flex-1" data-testid="telegram-text-input"/>
            <button onClick={send} className="e360-btn-primary inline-flex items-center gap-2" data-testid="telegram-send-btn">
              <Send className="w-4 h-4"/> Send
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Tip: open Telegram, search for the bot, send <code className="text-cyan-400">/start</code>, then check the live log below.
          </p>
        </div>
      </div>

      <div className="e360-card p-0 overflow-hidden" data-testid="telegram-log">
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
            <span className="text-sm font-medium">Live Message Log</span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">auto-refresh 5s</span>
        </div>
        <div className="p-4 dot-bg max-h-[500px] overflow-y-auto font-mono text-xs">
          {messages.length === 0 && <div className="text-zinc-600 text-center py-8">No messages yet. Open the bot in Telegram and say hi.</div>}
          {messages.slice().reverse().map((m) => (
            <div key={m.id} className="py-1.5 border-b border-white/[0.04] last:border-0">
              <span className="text-zinc-600">{new Date(m.ts).toLocaleTimeString()}</span>
              <span className={`mx-2 ${m.direction === "in" ? "text-emerald-400" : "text-cyan-400"}`}>
                {m.direction === "in" ? "▶" : "◀"}
              </span>
              <span className="text-zinc-400">[{m.username}]</span>
              <span className="text-zinc-200 ml-2 whitespace-pre-wrap">{m.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
