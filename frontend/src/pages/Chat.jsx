import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { Send, Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const loadThreads = async () => {
    const r = await api.get("/chat/threads");
    setThreads(r.data);
    if (!active && r.data[0]) selectThread(r.data[0].id);
  };

  const selectThread = async (id) => {
    setActive(id);
    const r = await api.get(`/chat/threads/${id}/messages`);
    setMessages(r.data);
  };

  useEffect(() => { loadThreads(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const newThread = async () => {
    const r = await api.post("/chat/threads", { title: "New Chat" });
    await loadThreads();
    selectThread(r.data.id);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !active) return;
    const t = text; setText(""); setSending(true);
    setMessages((m) => [...m, { id: "tmp", role: "user", text: t, ts: new Date().toISOString() }]);
    try {
      const r = await api.post("/chat/send", { thread_id: active, text: t });
      setMessages((m) => [...m.filter(x=>x.id!=="tmp"), r.data.user, r.data.assistant]);
    } catch (e) { toast.error("Send failed"); } finally { setSending(false); }
  };

  const delThread = async (id) => {
    await api.delete(`/chat/threads/${id}`);
    if (id === active) { setActive(null); setMessages([]); }
    loadThreads();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex" data-testid="chat-page">
      <aside className="w-64 border-r border-white/[0.08] flex flex-col bg-[#070707]">
        <div className="p-3 border-b border-white/[0.06]">
          <button onClick={newThread} className="e360-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm" data-testid="chat-new-thread-btn">
            <Plus className="w-4 h-4"/> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.map((t) => (
            <div key={t.id}
              onClick={() => selectThread(t.id)}
              className={`group flex items-start justify-between gap-2 px-3 py-2.5 rounded-md cursor-pointer mb-0.5 transition-all ${active === t.id ? "bg-white/[0.06] border border-white/10" : "hover:bg-white/[0.03] border border-transparent"}`}
              data-testid={`chat-thread-${t.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-[10px] text-zinc-500">{new Date(t.updated_at).toLocaleString()}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); delThread(t.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </div>
          ))}
          {threads.length === 0 && (
            <div className="text-xs text-zinc-500 p-4 text-center">No chats yet</div>
          )}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!active && (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto opacity-40 mb-3" strokeWidth={1}/>
                Start a new chat with Lara.
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${m.role === "user" ? "bg-cyan-400/10 border border-cyan-400/20 text-white" : "bg-white/[0.03] border border-white/[0.06] text-zinc-200"}`}>
                <pre className="whitespace-pre-wrap font-[Manrope]">{m.text}</pre>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 text-sm inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin"/> Thinking...
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {active && (
          <form onSubmit={send} className="p-4 border-t border-white/[0.08] bg-[#050505]">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input data-testid="chat-input" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Ask anything... (memory persists)" className="e360-input flex-1"/>
              <button type="submit" disabled={sending} className="e360-btn-primary inline-flex items-center gap-1.5" data-testid="chat-send-btn">
                <Send className="w-4 h-4"/> Send
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
