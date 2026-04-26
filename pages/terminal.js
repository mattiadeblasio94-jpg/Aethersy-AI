'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Terminal as TerminalIcon, Code, Bug, BookOpen, Wrench, Beaker, Zap, FileText, Eye,
  Sparkles, Play, Square, Copy, Download, Brain, Save, FolderOpen,
  ChevronDown, ChevronUp, Search, X, Check, AlertTriangle, Clock,
  Cpu, Layers, Settings, Moon, Sun
} from 'lucide-react';

async function safeJson(r) {
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { error: `Server error (${r.status}): ${t.slice(0, 150)}` }; }
}

const MODES = [
  { id: 'generate',  icon: Zap, label: 'Generate',  color: '#7c3aed', desc: 'Build complete code from scratch' },
  { id: 'debug',     icon: Bug, label: 'Debug',     color: '#ef4444', desc: 'Find and fix all bugs' },
  { id: 'explain',   icon: BookOpen, label: 'Explain',   color: '#06b6d4', desc: 'Break down how code works' },
  { id: 'refactor',  icon: Wrench, label: 'Refactor',  color: '#f59e0b', desc: 'Clean up and modernize' },
  { id: 'test',      icon: Beaker, label: 'Test',      color: '#10b981', desc: 'Write comprehensive tests' },
  { id: 'optimize',  icon: Zap, label: 'Optimize',  color: '#f97316', desc: 'Fix performance bottlenecks' },
  { id: 'document',  icon: FileText, label: 'Document',  color: '#8b5cf6', desc: 'Add docs and comments' },
  { id: 'review',    icon: Eye, label: 'Review',   color: '#14b8a6', desc: 'Code review with scoring' },
  { id: 'complete',  icon: Sparkles, label: 'Complete',  color: '#a78bfa', desc: 'Continue unfinished code' },
];

const LANGS = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript' },
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'html', label: 'HTML', monaco: 'html' },
  { id: 'css', label: 'CSS', monaco: 'css' },
  { id: 'sql', label: 'SQL', monaco: 'sql' },
  { id: 'bash', label: 'Bash', monaco: 'shell' },
  { id: 'rust', label: 'Rust', monaco: 'rust' },
  { id: 'go', label: 'Go', monaco: 'go' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'php', label: 'PHP', monaco: 'php' },
  { id: 'yaml', label: 'YAML', monaco: 'yaml' },
  { id: 'json', label: 'JSON', monaco: 'json' },
  { id: 'c', label: 'C', monaco: 'c' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'swift', label: 'Swift', monaco: 'swift' },
  { id: 'kotlin', label: 'Kotlin', monaco: 'kotlin' },
  { id: 'ruby', label: 'Ruby', monaco: 'ruby' },
];

const MONACO_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  renderWhitespace: 'selection',
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  padding: { top: 10, bottom: 10 },
  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
  fontLigatures: true,
};

export default function Terminal() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCat, setCat] = useState('');
  const [selectedTemplate, setTemplate] = useState(null);
  const [searchQ, setSearchQ] = useState('');

  const [mode, setMode] = useState('generate');
  const [instruction, setInstruction] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [language, setLang] = useState('javascript');

  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [tokens, setTokens] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Lara integration
  const [laraEnabled, setLaraEnabled] = useState(false);
  const [telegramId, setTelegramId] = useState('8074643162');
  const [laraStatus, setLaraStatus] = useState('disconnected');

  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const outputTextRef = useRef('');
  const editorRef = useRef(null);
  const codeEditorRef = useRef(null);

  useEffect(() => {
    loadCategories();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedCat) loadTemplates(selectedCat);
  }, [selectedCat]);

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  useEffect(() => {
    // Check Lara connection status
    setLaraStatus(laraEnabled ? 'connecting' : 'disconnected');
    if (laraEnabled) {
      setLaraStatus('connected');
      showToast('Lara integrata!', 'success');
    }
  }, [laraEnabled]);

  async function loadCategories() {
    const res = await fetch('/api/terminal?action=categories');
    const data = await safeJson(res);
    if (data.categories) setCategories(data.categories);
  }

  async function loadTemplates(cat) {
    setTemplates([]);
    const res = await fetch(`/api/terminal?action=list&category=${cat}`);
    const data = await safeJson(res);
    if (data.templates) setTemplates(data.templates);
  }

  async function doSearch(q) {
    if (!q.trim()) {
      if (selectedCat) loadTemplates(selectedCat);
      else setTemplates([]);
      return;
    }
    const res = await fetch(`/api/terminal?action=search&q=${encodeURIComponent(q)}`);
    const data = await safeJson(res);
    if (data.templates) setTemplates(data.templates);
  }

  function selectTemplate(t) {
    setTemplate(t);
    setInstruction(t.prompt);
    const lang = LANGS.find(l => l.id === t.output) || LANGS.find(l => l.id === 'javascript');
    setLang(lang.id);
    setOutput('');
    outputTextRef.current = '';
    setErr('');
    setTokens(0);
    setMode('generate');
  }

  async function run() {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setOutput('');
    outputTextRef.current = '';
    setErr('');
    setTokens(0);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      // If Lara is enabled, send to Lara terminal endpoint
      let endpoint = '/api/terminal';
      let body = {
        instruction,
        codeContext: showContext ? codeContext : '',
        language,
        mode,
        templateId: selectedTemplate?.id,
        maxTokens: 8000,
      };

      if (laraEnabled) {
        endpoint = '/api/terminal/lara';
        body = {
          telegramId,
          instruction,
          language,
          mode,
          project: 'aiforge-pro',
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const d = await safeJson(res);
        setErr(d.error || 'Server error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(part.slice(6));

            // Lara endpoint returns type: 'result' with full response
            if (ev.type === 'result') {
              outputTextRef.current = ev.response || '';
              setOutput(outputTextRef.current);
              setTokens(ev.tokens || 0);

              // Notify Telegram if Lara integration is active
              if (laraEnabled && telegramId) {
                await fetch('/api/telegram', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chatId: telegramId,
                    text: `✅ **Esecuzione Completata**\n\n📝 Istruzione: ${instruction.slice(0, 50)}...\n⚡ Token usati: ${ev.tokens}\n\nComandi generati: ${ev.commands?.length || 0}\nBlocchi codice: ${ev.code?.length || 0}`
                  })
                });
              }
            }

            // Standard terminal endpoint streams with ev.t
            if (ev.t) {
              outputTextRef.current += ev.t;
              setOutput(outputTextRef.current);
            }
            if (ev.done) setTokens(ev.tokens || 0);
            if (ev.error) setErr(ev.error);
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  async function loadSessions() {
    try {
      const userId = (() => {
        try {
          return JSON.parse(localStorage.getItem('aiforge_user') || '{}').email || 'anonymous';
        } catch {
          return 'anonymous';
        }
      })();
      const res = await fetch(`/api/sessions/list?userId=${encodeURIComponent(userId)}`);
      const data = await safeJson(res);
      if (data.sessions) setSessions(data.sessions.filter(s => s.tool === 'terminal'));
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }

  async function saveSession() {
    if (!outputTextRef.current || !sessionName.trim()) return;
    try {
      const userId = (() => {
        try {
          return JSON.parse(localStorage.getItem('aiforge_user') || '{}').email || 'anonymous';
        } catch {
          return 'anonymous';
        }
      })();
      await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tool: 'terminal',
          title: sessionName,
          data: { instruction, codeContext, language, mode, output: outputTextRef.current, template: selectedTemplate }
        }),
      });
      setSessionName('');
      await loadSessions();
      showToast('Sessione salvata', 'success');
    } catch {
      showToast('Errore salvataggio', 'error');
    }
  }

  function loadSessionData(s) {
    if (s.data) {
      setInstruction(s.data.instruction || s.data.prompt || '');
      setCodeContext(s.data.codeContext || '');
      setLang(s.data.language || 'javascript');
      setMode(s.data.mode || 'generate');
      outputTextRef.current = s.data.output || '';
      setOutput(s.data.output || '');
      setTemplate(s.data.template || null);
    }
    setShowSessions(false);
  }

  async function saveToWiki() {
    const text = outputTextRef.current;
    if (!text) return;
    const title = selectedTemplate?.title || `Terminal ${new Date().toLocaleDateString('it-IT')}`;
    const content = `## Instruction\n\`\`\`\n${instruction.slice(0, 500)}\n\`\`\`\n\n## Output\n\`\`\`${language}\n${text.slice(0, 4000)}\n\`\`\``;
    try {
      await fetch('/api/wiki/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, title, tags: ['terminal', language, mode, selectedTemplate?.category || 'code'] }),
      });
      showToast('Salvato nel Second Brain!', 'success');
    } catch {
      showToast('Errore salvataggio', 'error');
    }
  }

  function copyOutput() {
    navigator.clipboard?.writeText(outputTextRef.current);
    showToast('Copiato negli appunti!', 'success');
  }

  function downloadOutput() {
    const text = outputTextRef.current;
    if (!text) return;
    const ext = { javascript: 'js', typescript: 'ts', python: 'py', html: 'html', css: 'css', sql: 'sql', bash: 'sh', rust: 'rs', go: 'go', java: 'java', php: 'php', yaml: 'yaml', json: 'json', c: 'c', cpp: 'cpp', swift: 'swift', kotlin: 'kt', ruby: 'rb' }[language] || 'txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aiforge_${mode}_${Date.now()}.${ext}`;
    a.click();
    showToast('Download avviato', 'success');
  }

  function copyInstruction() {
    navigator.clipboard?.writeText(instruction);
    showToast('Istruzione copiata!', 'success');
  }

  function showToast(msg, type = 'success') {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  }

  function handleEditorMount(editor) {
    editorRef.current = editor;
  }

  function handleCodeEditorMount(editor) {
    codeEditorRef.current = editor;
  }

  const currentMode = MODES.find(m => m.id === mode) || MODES[0];
  const CurrentIcon = currentMode.icon;
  const hasOutput = !!outputTextRef.current;
  const langConfig = LANGS.find(l => l.id === language) || LANGS[0];

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sideTop}>
          <Link href="/dashboard" style={S.backBtn}>
            <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} />
            Dashboard
          </Link>
          <div style={S.logo}>
            <TerminalIcon size={18} style={{ marginRight: 6 }} />
            AI Terminal
          </div>
          <div style={S.logosub}>Claude Code — Elite</div>
        </div>

        <div style={S.sectionLabel}>AI MODE</div>
        <div style={S.modeList}>
          {MODES.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                style={{
                  ...S.modeBtn,
                  ...(mode === m.id ? { ...S.modeBtnActive, borderColor: m.color + '44', background: m.color + '11' } : {})
                }}
                onClick={() => {
                  setMode(m.id);
                  setOutput('');
                  outputTextRef.current = '';
                  setErr('');
                  setTokens(0);
                }}
              >
                <Icon size={16} style={{ color: mode === m.id ? m.color : '#475569' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: mode === m.id ? 700 : 400, color: mode === m.id ? m.color : '#475569' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={S.sectionLabel}>LANGUAGE</div>
        <div style={{ padding: '0 0.7rem 0.7rem' }}>
          <select style={S.langSelect} value={language} onChange={e => setLang(e.target.value)}>
            {LANGS.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }} />

        {/* Lara Integration */}
        <div style={S.sectionLabel}>LARA INTEGRATION</div>
        <div style={{ padding: '0 0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Telegram Bot</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: laraEnabled ? '#10b981' : '#475569',
                boxShadow: laraEnabled ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
              }} />
              <span style={{ fontSize: '0.65rem', color: laraEnabled ? '#34d399' : '#475569' }}>
                {laraEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <button
            style={{
              width: '100%',
              background: laraEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${laraEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
              color: laraEnabled ? '#34d399' : '#94a3b8',
              borderRadius: 8,
              padding: '0.45rem',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '0.5rem'
            }}
            onClick={() => setLaraEnabled(!laraEnabled)}
          >
            {laraEnabled ? '✓ Lara Attiva' : '⚡ Attiva Lara'}
          </button>
          {laraEnabled && (
            <input
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 8,
                color: '#f1f5f9',
                padding: '0.4rem 0.6rem',
                fontSize: '0.7rem',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              placeholder="Telegram ID"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
            />
          )}
        </div>

        <div style={S.sideFooter}>
          <button style={S.footBtn} onClick={() => setShowSessions(v => !v)}>
            <FolderOpen size={14} style={{ marginRight: 6 }} />
            Sessions ({sessions.length})
          </button>
          <Link href="/wiki" style={{ ...S.footBtn, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Brain size={14} style={{ marginRight: 6 }} />
            Second Brain
          </Link>
        </div>
      </aside>

      {/* Template panel */}
      <div style={S.tplPanel}>
        <div style={S.tplHeader}>
          <div style={S.searchBox}>
            <Search size={14} style={{ color: '#475569', marginRight: 6 }} />
            <input
              style={S.searchInput}
              placeholder="Search templates..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); doSearch(e.target.value); }}
            />
          </div>
        </div>
        <div style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            <button
              style={{ ...S.catPill, ...(selectedCat === '' ? S.catPillActive : {}) }}
              onClick={() => { setCat(''); setTemplates([]); }}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                style={{ ...S.catPill, ...(selectedCat === c.id ? S.catPillActive : {}) }}
                onClick={() => { setCat(c.id); setSearchQ(''); }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {templates.length === 0 && (
            <div style={{ padding: '1.2rem', color: '#475569', fontSize: '0.8rem', lineHeight: 1.7 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
              Select a category or search.<br />
              <span style={{ color: currentMode.color }}>500+ templates</span> ready for AI agents, APIs, SaaS, automation & more.
            </div>
          )}
          {templates.map(t => (
            <button
              key={t.id}
              style={{
                ...S.tplCard,
                ...(selectedTemplate?.id === t.id ? { ...S.tplActive, borderLeft: `3px solid ${currentMode.color}` } : {})
              }}
              onClick={() => selectTemplate(t)}
            >
              <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.79rem', color: '#e2e8f0', marginBottom: '0.2rem' }}>{t.title}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>{t.desc?.slice(0, 65)}</div>
              {t.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.35rem' }}>
                  {t.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ ...S.tag, background: `${currentMode.color}22`, color: currentMode.color }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main IDE area */}
      <main style={S.main}>
        {/* Toolbar */}
        <div style={S.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ ...S.modeBadge, background: `${currentMode.color}22`, color: currentMode.color, borderColor: `${currentMode.color}44` }}>
              <CurrentIcon size={14} style={{ marginRight: 4 }} />
              {currentMode.label}
            </div>
            {selectedTemplate && (
              <span style={S.templateBadge}>{selectedTemplate.icon} {selectedTemplate.title}</span>
            )}
            <span style={{ color: '#334155', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Code size={12} />
              {langConfig.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {loading && (
              <span style={{ color: '#475569', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />
                {elapsed}s
              </span>
            )}
            {hasOutput && !loading && (
              <>
                <button style={S.iconBtn} onClick={copyOutput} title="Copy">
                  <Copy size={14} />
                </button>
                <button style={S.iconBtn} onClick={downloadOutput} title="Download">
                  <Download size={14} />
                </button>
                <button style={S.iconBtn} onClick={saveToWiki} title="Save to Second Brain">
                  <Brain size={14} />
                </button>
              </>
            )}
            {loading ? (
              <button style={{ ...S.runBtn, background: '#ef4444' }} onClick={stop}>
                <Square size={14} style={{ marginRight: 4 }} />
                Stop
              </button>
            ) : (
              <button
                style={{
                  ...S.runBtn,
                  background: `linear-gradient(135deg,${currentMode.color},#06b6d4)`,
                  opacity: !instruction.trim() ? 0.5 : 1
                }}
                onClick={run}
                disabled={!instruction.trim()}
              >
                <Play size={14} style={{ marginRight: 4 }} />
                Run
              </button>
            )}
          </div>
        </div>

        {/* Input section with Monaco Editor */}
        <div style={S.inputSection}>
          <div style={S.inputRow}>
            <div style={S.inputLabel}>
              <span style={{ color: currentMode.color }}>{currentMode.label.toUpperCase()}</span>
              <span style={{ color: '#334155', fontWeight: 400, marginLeft: '0.5rem' }}>{currentMode.desc}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button style={S.copyBtn} onClick={copyInstruction} title="Copy instruction">
                <Copy size={12} />
              </button>
              <button style={S.contextToggle} onClick={() => setShowContext(v => !v)}>
                {showContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showContext ? 'Hide code context' : 'Add code context'}
              </button>
            </div>
          </div>
          <div style={S.editorContainer}>
            <Editor
              height="120px"
              language={langConfig.monaco}
              value={instruction}
              onChange={v => setInstruction(v || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                ...MONACO_OPTIONS,
                lineNumbers: 'off',
                glyphMargin: false,
                foldGutter: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
              }}
            />
          </div>
          {showContext && (
            <>
              <div style={{ ...S.inputLabel, marginTop: '0.5rem' }}>
                <span style={{ color: '#06b6d4' }}>CODE CONTEXT</span>
                <span style={{ color: '#334155', fontWeight: 400, marginLeft: '0.5rem' }}>— paste existing code here</span>
              </div>
              <div style={S.editorContainer}>
                <Editor
                  height="150px"
                  language={langConfig.monaco}
                  value={codeContext}
                  onChange={v => setCodeContext(v || '')}
                  onMount={handleCodeEditorMount}
                  theme="vs-dark"
                  options={MONACO_OPTIONS}
                />
              </div>
            </>
          )}
          <div style={S.inputHint}>
            <span style={{ color: '#1e293b' }}>Ctrl+Enter to run</span>
            <span style={{ color: '#334155' }}>• {instruction.length} chars</span>
            {tokens > 0 && (
              <span style={{ marginLeft: '0.8rem', color: currentMode.color }}>
                <Cpu size={10} style={{ marginRight: 4, display: 'inline' }} />
                {tokens} tokens used
              </span>
            )}
          </div>
        </div>

        {/* Output with Syntax Highlighting */}
        <div style={S.outputWrap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexShrink: 0 }}>
            <div style={S.outputLabel}>
              <Layers size={12} style={{ marginRight: 4 }} />
              OUTPUT
              {loading && <span style={{ ...S.statusDot, background: currentMode.color }} />}
              {loading && (
                <span style={{ color: currentMode.color, fontSize: '0.7rem', marginLeft: '0.3rem' }}>
                  streaming…
                </span>
              )}
            </div>
            {hasOutput && !loading && (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  style={S.sessionInput}
                  placeholder="Session name..."
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                />
                <button
                  style={{ ...S.iconBtn, ...S.saveBtn }}
                  onClick={saveSession}
                  disabled={!sessionName.trim()}
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            )}
          </div>

          {err && (
            <div style={S.errBox}>
              <AlertTriangle size={14} style={{ marginRight: 6, display: 'inline' }} />
              {err}
            </div>
          )}

          {!hasOutput && !loading && !err && (
            <div style={S.emptyState}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem', color: currentMode.color }}>
                <CurrentIcon size={64} />
              </div>
              <div style={{ color: currentMode.color, fontWeight: 700, marginBottom: '0.3rem', fontSize: '1.1rem' }}>
                {currentMode.label} mode
              </div>
              <div style={{ color: '#475569', fontSize: '0.83rem' }}>{currentMode.desc}</div>
              <div style={{ color: '#334155', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Write an instruction and press Run
              </div>
            </div>
          )}

          {(hasOutput || loading) && (
            <div style={{
              ...S.outputPre,
              borderColor: hasOutput ? `${currentMode.color}33` : 'rgba(255,255,255,0.04)'
            }}>
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  fontSize: '0.81rem',
                  lineHeight: 1.75,
                  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                }}
              >
                {outputTextRef.current || (loading ? 'Generating...' : '')}
              </SyntaxHighlighter>
              {loading && (
                <span style={{ ...S.cursor, background: currentMode.color }} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sessions drawer */}
      {showSessions && (
        <div style={S.drawer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderOpen size={16} />
              Saved Sessions
            </h3>
            <button
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
              onClick={() => setShowSessions(false)}
            >
              <X size={16} />
            </button>
          </div>
          {sessions.length === 0 && (
            <div style={{ color: '#475569', fontSize: '0.8rem' }}>No saved sessions.</div>
          )}
          {sessions.map(s => (
            <div key={s.id} style={S.sessionCard}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.2rem' }}>
                {s.title}
              </div>
              <div style={{ color: '#475569', fontSize: '0.7rem' }}>
                {new Date(s.updatedAt).toLocaleString('it-IT')}
              </div>
              <button
                style={{ ...S.iconBtn, marginTop: '0.4rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => loadSessionData(s)}
              >
                <Play size={12} />
                Load
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toastType === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toastType === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: 10,
          padding: '10px 22px',
          color: toastType === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.88rem',
          fontWeight: 600,
          zIndex: 300,
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {toastType === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast}
        </div>
      )}
    </div>
  );
}

function getPlaceholder(mode) {
  const map = {
    generate: 'Describe what you want to build...\n\nEx: Create a REST API with Express.js that handles user authentication with JWT, refresh tokens, and rate limiting.',
    debug: 'Describe the bug or paste code to analyze...\n\nEx: This function returns undefined sometimes but I can\'t figure out why.',
    explain: 'Ask about code you want to understand...\n\nEx: Explain this React hook and why it uses useCallback.',
    refactor: 'Describe how you want to improve the code...\n\nEx: Refactor this to use modern ES2024 patterns and improve readability.',
    test: 'Describe what to test...\n\nEx: Write tests for the authentication middleware including edge cases.',
    optimize: 'Describe the performance problem...\n\nEx: This query is running slow on 1M+ rows, optimize it.',
    document: 'Paste code to document...\n\nEx: Add JSDoc comments to all functions and add a module overview.',
    review: 'Describe what to review...\n\nEx: Review this PR for security issues, performance, and best practices.',
    complete: 'Paste your partial code and describe what\'s missing...\n\nEx: Complete this React component, it should handle form validation and submission.',
  };
  return map[mode] || 'Write your instruction here...';
}

const S = {
  root: { display: 'flex', height: '100vh', background: '#070710', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' },

  sidebar: { width: 200, background: '#08080f', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideTop: { padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: '0.75rem', textDecoration: 'none', marginBottom: '0.5rem', cursor: 'pointer' },
  logo: { display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: '0.85rem', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logosub: { color: '#334155', fontSize: '0.6rem', marginTop: '0.15rem' },
  sectionLabel: { color: '#1e293b', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', padding: '0.7rem 0.7rem 0.3rem' },
  modeList: { display: 'flex', flexDirection: 'column', gap: '0.1rem', padding: '0 0.5rem' },
  modeBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', border: '1px solid transparent', borderRadius: 8, background: 'transparent', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s' },
  modeBtnActive: { background: 'rgba(255,255,255,0.04)' },
  langSelect: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#94a3b8', padding: '0.4rem 0.6rem', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  sideFooter: { padding: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  footBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', borderRadius: 8, padding: '0.45rem', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' },

  tplPanel: { width: 250, background: '#090914', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  tplHeader: { padding: '0.7rem' },
  searchBox: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.45rem 0.7rem' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit' },
  catPill: { display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', borderRadius: 12, padding: '0.25rem 0.55rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  catPillActive: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', borderColor: 'rgba(124,58,237,0.4)' },
  tplCard: { width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderLeft: '3px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem 0.85rem', cursor: 'pointer', transition: 'all 0.12s' },
  tplActive: { background: 'rgba(124,58,237,0.08)' },
  tag: { borderRadius: 4, fontSize: '0.6rem', padding: '0.15rem 0.4rem', fontFamily: 'monospace' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#08080f', flexShrink: 0, gap: '0.5rem' },
  modeBadge: { display: 'flex', alignItems: 'center', border: '1px solid', borderRadius: 8, padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 },
  templateBadge: { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.72rem' },
  runBtn: { display: 'flex', alignItems: 'center', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8', borderRadius: 7, padding: '0.35rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  saveBtn: { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' },
  copyBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8', borderRadius: 7, padding: '0.3rem 0.6rem', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },

  inputSection: { padding: '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
  inputRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' },
  inputLabel: { display: 'flex', alignItems: 'center', color: '#1e293b', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em' },
  contextToggle: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#334155', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', padding: '0.25rem 0.5rem', borderRadius: 6 },
  editorContainer: { border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' },
  inputHint: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '0.65rem', marginTop: '0.4rem' },

  outputWrap: { flex: 1, padding: '0.7rem 1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  outputLabel: { display: 'flex', alignItems: 'center', color: '#1e293b', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em' },
  statusDot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' },
  outputPre: { flex: 1, background: '#040410', border: '1px solid', borderRadius: 10, padding: '1rem 1.1rem', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, position: 'relative' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155' },
  errBox: { display: 'flex', alignItems: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.6rem 0.9rem', color: '#f87171', fontSize: '0.81rem', marginBottom: '0.6rem' },
  cursor: { display: 'inline-block', width: 2, height: '1em', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s infinite' },

  sessionInput: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, color: '#f1f5f9', padding: '0.35rem 0.65rem', fontSize: '0.75rem', outline: 'none', width: 150, fontFamily: 'inherit' },
  drawer: { position: 'fixed', right: 0, top: 0, height: '100vh', width: 280, background: '#0b0b1a', borderLeft: '1px solid rgba(255,255,255,0.09)', padding: '1.2rem', overflowY: 'auto', zIndex: 100 },
  sessionCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.6rem' },
};
