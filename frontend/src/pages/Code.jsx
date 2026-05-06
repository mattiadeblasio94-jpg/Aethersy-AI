import React, { useState } from "react";
import { api } from "../lib/api";
import { Code2, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const LANGS = ["python", "javascript", "typescript", "go", "rust", "java", "csharp", "ruby", "php", "swift", "kotlin", "sql", "bash"];

export default function Code() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setCode("");
    try {
      const r = await api.post("/code/generate", { prompt, language });
      setCode(r.data.code);
    } catch (e) { toast.error("Generation failed"); } finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 md:p-8" data-testid="code-page">
      <div className="mb-6">
        <div className="e360-overline text-cyan-400">Code Generator</div>
        <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Ship code, not boilerplate.</h1>
        <p className="text-zinc-500 mt-1 text-sm">Multi-language. Powered by Gemini 3 Flash for speed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="e360-card p-6 space-y-4">
          <div>
            <label className="e360-overline">Describe what you need</label>
            <textarea data-testid="code-prompt-input" value={prompt} onChange={(e)=>setPrompt(e.target.value)}
              className="e360-input w-full mt-2 min-h-[180px]"
              placeholder="A function that throttles async calls with a retry queue..." />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="e360-overline">Language</label>
              <select className="e360-input w-full mt-2" value={language} onChange={(e)=>setLanguage(e.target.value)} data-testid="code-language-select">
                {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={generate} disabled={loading} className="e360-btn-primary inline-flex items-center gap-2 mt-5" data-testid="code-generate-btn">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Generating...</> : <><Code2 className="w-4 h-4"/>Generate</>}
            </button>
          </div>
        </div>

        <div className="e360-card p-0 overflow-hidden flex flex-col" data-testid="code-output">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"/>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60"/>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"/>
              <span className="text-xs text-zinc-500 ml-2 font-mono">{language}.{language === "python" ? "py" : "src"}</span>
            </div>
            {code && (
              <button onClick={copy} className="text-xs inline-flex items-center gap-1.5 text-zinc-400 hover:text-white" data-testid="code-copy-btn">
                {copied ? <><Check className="w-3 h-3"/>Copied</> : <><Copy className="w-3 h-3"/>Copy</>}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 dot-bg min-h-[300px]">
            {loading && <div className="text-zinc-500 text-sm animate-pulse">Generating code...</div>}
            {!loading && !code && (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                <Code2 className="w-8 h-8 opacity-30 mr-2" strokeWidth={1}/> Output will appear here
              </div>
            )}
            {!loading && code && (
              <pre className="text-xs text-cyan-100 font-mono whitespace-pre-wrap leading-relaxed">{code}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
