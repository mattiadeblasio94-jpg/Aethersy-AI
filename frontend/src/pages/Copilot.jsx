import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { Terminal, Loader2, Send, ChevronRight, FileText, Folder, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Copilot() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [trace, setTrace] = useState([]);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const endRef = useRef(null);

  const loadHistory = () => api.get("/copilot/history").then((r) => setHistory(r.data));
  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [trace, answer]);

  const run = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    const p = prompt; setPrompt(""); setRunning(true);
    setTrace([{ type: "user", content: p }]); setAnswer("");
    try {
      const r = await api.post("/copilot/run", { prompt: p });
      setTrace([{ type: "user", content: p }, ...(r.data.trace || [])]);
      setAnswer(r.data.answer || "");
      loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Copilot error");
    } finally { setRunning(false); }
  };

  const replay = (item) => {
    setPrompt(item.prompt);
    setTrace([{ type: "user", content: item.prompt }, ...(item.trace || [])]);
    setAnswer(item.answer);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]" data-testid="copilot-page">
      <aside className="w-72 border-r border-white/[0.08] flex flex-col bg-[#070707]">
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
            <div className="font-bold text-sm" style={{fontFamily:'Cabinet Grotesk'}}>Copilot · Lara</div>
          </div>
          <div className="text-[10px] text-zinc-500">GPT-5-nano · sandbox terminal</div>
        </div>
        <div className="px-3 py-2 e360-overline">History</div>
        <div className="flex-1 overflow-y-auto px-2">
          {history.length === 0 && <div className="text-xs text-zinc-500 px-2 py-4">Nessuna run ancora.</div>}
          {history.map((h) => (
            <button key={h.id} onClick={() => replay(h)} className="w-full text-left px-3 py-2 rounded-md text-xs mb-0.5 hover:bg-white/[0.03]" data-testid={`copilot-history-${h.id}`}>
              <div className="text-zinc-200 line-clamp-2">{h.prompt}</div>
              <div className="text-[10px] text-zinc-500 mt-1 inline-flex items-center gap-1">
                <Clock className="w-3 h-3"/> {new Date(h.ts).toLocaleString()} · {h.iterations} it
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col bg-[#050505]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {trace.length === 0 && !running && (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <div className="max-w-md text-center">
                <Terminal className="w-12 h-12 mx-auto opacity-40 mb-4" strokeWidth={1}/>
                <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Cabinet Grotesk'}}>Copilot pronto</h2>
                <p className="text-sm leading-relaxed">
                  Dai un prompt e Lara eseguirà i passi: legge file, scrive codice, esegue comandi nel sandbox.
                </p>
                <div className="mt-6 grid gap-2 text-xs text-left">
                  <Suggestion onClick={(s)=>setPrompt(s)} text="Crea un file hello.py che stampa la fibonacci dei primi 10 numeri ed eseguilo"/>
                  <Suggestion onClick={(s)=>setPrompt(s)} text="Lista i file nel sandbox e spiegami cosa contengono"/>
                  <Suggestion onClick={(s)=>setPrompt(s)} text="Scrivi un piccolo script bash che elenchi i 5 file più grandi della cartella corrente"/>
                </div>
              </div>
            </div>
          )}

          {trace.map((step, i) => <TraceStep key={i} step={step}/>)}

          {running && (
            <div className="text-cyan-400 text-sm inline-flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin"/> Lara sta lavorando...
            </div>
          )}

          {answer && !running && (
            <div className="e360-card p-5 border-cyan-400/30 animate-fade-up">
              <div className="e360-overline text-cyan-400 mb-2">Risultato</div>
              <pre className="whitespace-pre-wrap font-[Manrope] text-sm leading-relaxed text-zinc-200">{answer}</pre>
            </div>
          )}

          <div ref={endRef}/>
        </div>

        <form onSubmit={run} className="p-4 border-t border-white/[0.08]">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              data-testid="copilot-prompt-input"
              value={prompt} onChange={(e)=>setPrompt(e.target.value)}
              placeholder="Cosa devo fare? (es. 'crea uno script python che...')"
              className="e360-input flex-1"
              disabled={running}
            />
            <button type="submit" disabled={running} className="e360-btn-primary inline-flex items-center gap-2" data-testid="copilot-run-btn">
              {running ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} Run
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const Suggestion = ({ text, onClick }) => (
  <button onClick={() => onClick(text)} className="w-full p-2 rounded-md bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/30 text-zinc-400 hover:text-white transition-all">
    <ChevronRight className="w-3 h-3 inline mr-1 text-cyan-400"/> {text}
  </button>
);

const TraceStep = ({ step }) => {
  if (step.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-sm">{step.content}</div>
      </div>
    );
  }
  if (step.type === "tool_call") {
    return (
      <div className="text-xs">
        <div className="inline-flex items-center gap-2 text-cyan-400 px-3 py-1.5 rounded-md bg-cyan-400/[0.05] border border-cyan-400/20">
          {step.tool === "shell_exec" && <Terminal className="w-3.5 h-3.5"/>}
          {step.tool === "write_file" && <FileText className="w-3.5 h-3.5"/>}
          {step.tool === "read_file" && <FileText className="w-3.5 h-3.5"/>}
          {step.tool === "list_dir" && <Folder className="w-3.5 h-3.5"/>}
          <span className="font-mono">{step.tool}</span>
          <span className="text-zinc-400 truncate max-w-md">{
            step.tool === "shell_exec" ? step.args.command :
            step.tool === "write_file" || step.tool === "read_file" ? step.args.path :
            step.tool === "list_dir" ? (step.args.path || "/") : ""
          }</span>
        </div>
      </div>
    );
  }
  if (step.type === "tool_result") {
    const r = step.result || {};
    return (
      <div className="ml-4 text-xs font-mono p-3 rounded-md bg-black/40 border border-white/[0.04] max-h-40 overflow-y-auto">
        <pre className={`whitespace-pre-wrap ${r.ok === false ? "text-red-400" : "text-zinc-300"}`}>
          {r.stdout || r.content || (r.items && JSON.stringify(r.items, null, 2)) || r.error || (r.ok ? "OK" : "")}
          {r.stderr ? `\n[stderr] ${r.stderr}` : ""}
        </pre>
      </div>
    );
  }
  if (step.type === "final") return null; // shown in dedicated card
  if (step.type === "error") {
    return <div className="text-red-400 text-sm">{step.message}</div>;
  }
  return null;
};
