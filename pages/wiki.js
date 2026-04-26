import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

const TYPE_META = {
  source:    { label: 'Source',    color: '#06b6d4', icon: '📄' },
  entity:    { label: 'Entity',    color: '#7c3aed', icon: '🏢' },
  concept:   { label: 'Concept',   color: '#10b981', icon: '💡' },
  synthesis: { label: 'Synthesis', color: '#f59e0b', icon: '🔗' },
  query:     { label: 'Query',     color: '#a78bfa', icon: '❓' },
};

function safeJson(res) {
  return res.ok ? res.json().catch(() => ({})) : res.json().catch(() => ({ error: `HTTP ${res.status}` }));
}

// ── Ingest Panel ──────────────────────────────────────────────────────────────
function IngestPanel({ onDone }) {
  const [mode, setMode] = useState('paste');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleIngest() {
    if (mode === 'paste' && !text.trim()) return setError('Inserisci del testo');
    if (mode === 'url' && !url.trim()) return setError('Inserisci un URL');
    setLoading(true); setError(''); setResult(null);
    const body = mode === 'url' ? { url: url.trim(), title } : { text: text.trim(), title };
    const data = await fetch('/api/wiki/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(safeJson);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setResult(data);
    setText(''); setUrl(''); setTitle('');
    onDone?.();
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Ingest</h2>
      <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: 14 }}>
        Incolla testo o URL — l'AI legge, estrae pagine wiki e aggiorna il catalogo.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['paste', 'url'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: mode === m ? '#6366f1' : '#1e293b', color: mode === m ? '#fff' : '#94a3b8',
          }}>{m === 'paste' ? '📋 Testo' : '🔗 URL'}</button>
        ))}
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titolo (opzionale)"
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
      />
      {mode === 'paste' ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Incolla qui articoli, note, ricerche, trascrizioni..."
          rows={10}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
      ) : (
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }}
        />
      )}
      {error && <p style={{ color: '#f87171', margin: '8px 0 0', fontSize: 13 }}>{error}</p>}
      <button
        onClick={handleIngest}
        disabled={loading}
        style={{ marginTop: 16, padding: '12px 32px', background: loading ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? '⏳ Ingesting...' : '🧠 Ingest'}
      </button>
      {result && (
        <div style={{ marginTop: 24, padding: 20, background: '#0f2027', borderRadius: 12, border: '1px solid #10b981' }}>
          <p style={{ color: '#10b981', fontWeight: 700, margin: '0 0 12px' }}>✅ Ingested {result.count} pagine</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(result.pages || []).map(p => (
              <span key={p.id} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: TYPE_META[p.type]?.color + '22', color: TYPE_META[p.type]?.color,
                border: `1px solid ${TYPE_META[p.type]?.color}44`,
              }}>
                {TYPE_META[p.type]?.icon} {p.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Query Panel ───────────────────────────────────────────────────────────────
function QueryPanel({ pages }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleQuery() {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    const data = await fetch('/api/wiki/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    }).then(safeJson);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setResult(data);
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Query</h2>
      <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: 14 }}>
        Interroga la wiki — l'AI risponde citando le pagine esistenti.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuery()}
          placeholder="Cosa vuoi sapere dalla wiki?"
          style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 15 }}
        />
        <button
          onClick={handleQuery}
          disabled={loading}
          style={{ padding: '12px 24px', background: loading ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontSize: 18 }}
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>
      {error && <p style={{ color: '#f87171', margin: '8px 0 0', fontSize: 13 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ padding: 20, background: '#0f172a', borderRadius: 12, border: '1px solid #334155', marginBottom: 16 }}>
            <div style={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: 15 }}>
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>
          </div>
          {result.sources?.length > 0 && (
            <div>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 8px' }}>Fonti utilizzate:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.sources.map(s => (
                  <span key={s.id} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: TYPE_META[s.type]?.color + '22', color: TYPE_META[s.type]?.color,
                    border: `1px solid ${TYPE_META[s.type]?.color}44`,
                  }}>
                    {TYPE_META[s.type]?.icon} {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {!result && !loading && pages.length === 0 && (
        <div style={{ marginTop: 40, textAlign: 'center', color: '#475569' }}>
          <p style={{ fontSize: 40 }}>🧠</p>
          <p>La wiki è vuota. Inizia con Ingest.</p>
        </div>
      )}
    </div>
  );
}

// ── Lint Panel ────────────────────────────────────────────────────────────────
function LintPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleLint() {
    setLoading(true); setError(''); setResult(null);
    const data = await fetch('/api/wiki/lint', { method: 'POST' }).then(safeJson);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setResult(data);
  }

  const ISSUE_COLORS = {
    orphan: '#f87171', 'no-tags': '#fbbf24', stub: '#fb923c',
    'broken-ref': '#f87171', contradiction: '#f43f5e', duplicate: '#e879f9', gap: '#94a3b8',
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Lint</h2>
      <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: 14 }}>
        Analizza la wiki: trova orfani, riferimenti rotti, contraddizioni e lacune.
      </p>
      <button
        onClick={handleLint}
        disabled={loading}
        style={{ padding: '12px 32px', background: loading ? '#334155' : 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? '⏳ Analisi in corso...' : '🔍 Esegui Lint'}
      </button>
      {error && <p style={{ color: '#f87171', margin: '8px 0 0', fontSize: 13 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { label: 'Pagine', value: result.stats?.total || 0, color: '#6366f1' },
              { label: 'Parole', value: result.stats?.totalWords || 0, color: '#10b981' },
              { label: 'Link', value: result.stats?.totalLinks || 0, color: '#0ea5e9' },
              { label: 'Orfani', value: result.stats?.orphans || 0, color: '#f87171' },
              { label: 'Problemi', value: result.issues?.length || 0, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 20px', background: '#1e293b', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {result.summary && (
            <div style={{ padding: 16, background: '#0f172a', borderRadius: 10, border: '1px solid #334155', marginBottom: 16 }}>
              <p style={{ color: '#e2e8f0', margin: 0, fontSize: 14 }}>{result.summary}</p>
            </div>
          )}
          {result.issues?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px' }}>Problemi trovati:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#1e293b', borderRadius: 8, borderLeft: `3px solid ${ISSUE_COLORS[issue.type] || '#64748b'}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ISSUE_COLORS[issue.type] || '#64748b', minWidth: 80, paddingTop: 1 }}>{issue.type?.toUpperCase()}</span>
                    <div>
                      {issue.title && <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{issue.title}</div>}
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>{issue.message}</div>
                      {issue.suggestion && <div style={{ color: '#6366f1', fontSize: 12, marginTop: 4 }}>→ {issue.suggestion}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.missingPages?.length > 0 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px' }}>Pagine suggerite da creare:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.missingPages.map((title, i) => (
                  <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: '#1e293b', color: '#94a3b8', border: '1px dashed #334155' }}>+ {title}</span>
                ))}
              </div>
            </div>
          )}
          {result.issues?.length === 0 && <p style={{ color: '#10b981', fontWeight: 700 }}>✅ Wiki in ottimo stato — nessun problema trovato.</p>}
        </div>
      )}
    </div>
  );
}

// ── Files Panel ───────────────────────────────────────────────────────────────
function FilesPanel() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = typeof window !== 'undefined' ? null : null;

  useEffect(() => {
    fetch('/api/wiki/files').then(r => r.json()).then(d => {
      setFiles(d.files || []);
    }).catch(() => {});
  }, []);

  async function uploadFile(file) {
    setUploading(true); setErr('');
    const fileType = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio'
      : 'text';
    try {
      const res = await fetch('/api/wiki/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-filename': encodeURIComponent(file.name),
          'x-file-type': fileType,
        },
        body: file,
      });
      const data = await res.json();
      if (data.error) { setErr(data.error); return; }
      setFiles(prev => [{ ...data, uploadedAt: Date.now() }, ...prev]);
    } catch (e) { setErr(e.message); }
    finally { setUploading(false); }
  }

  function handleDrop(e) {
    e.preventDefault(); setDrag(false);
    const droppedFiles = [...(e.dataTransfer?.files || [])];
    droppedFiles.forEach(uploadFile);
  }

  function handleInput(e) {
    [...(e.target.files || [])].forEach(uploadFile);
  }

  function downloadFile(url, name) {
    const a = document.createElement('a');
    a.href = url; a.download = name || 'file'; a.target = '_blank'; a.click();
  }

  const iconFor = (f) => {
    if (f.fileType === 'image') return '🖼';
    if (f.fileType === 'video') return '🎬';
    if (f.fileType === 'audio') return '🎵';
    return '📄';
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Files</h2>
      <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: 14 }}>
        Upload and manage your files — images, videos, audio, and documents.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{ border: `2px dashed ${drag ? '#6366f1' : '#1e293b'}`, borderRadius: 14, padding: 32, textAlign: 'center', marginBottom: 24, background: drag ? 'rgba(99,102,241,0.06)' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
        onClick={() => document.getElementById('wikiFileInput').click()}
      >
        <input id="wikiFileInput" type="file" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.md,.json,.csv" onChange={handleInput} style={{ display: 'none' }} />
        <div style={{ fontSize: 40, marginBottom: 8 }}>{uploading ? '⏳' : '📁'}</div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>
          {uploading ? 'Uploading...' : 'Drag & drop files or click to upload'}
        </div>
        <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>Images, Videos, Audio, PDF, Text</div>
      </div>

      {err && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>⚠️ {err}</p>}

      {/* File grid */}
      {files.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', color: '#334155', padding: 32 }}>No files uploaded yet.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {files.map((f, i) => (
          <div key={f.id || f.url || i} style={{ background: '#0f172a', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b' }}>
            <div style={{ height: 110, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {f.fileType === 'image' ? (
                <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : f.fileType === 'video' ? (
                <video src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              ) : f.fileType === 'audio' ? (
                <div style={{ padding: 12, width: '100%' }}>
                  <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>🎵</div>
                  <audio src={f.url} controls style={{ width: '100%' }} />
                </div>
              ) : (
                <span style={{ fontSize: 36 }}>{iconFor(f)}</span>
              )}
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                {f.name || 'File'}
              </div>
              <div style={{ color: '#475569', fontSize: 10, marginBottom: 6 }}>
                {f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('it-IT') : ''}
                {f.size ? ` · ${(f.size / 1024).toFixed(0)}KB` : ''}
              </div>
              <button
                onClick={() => downloadFile(f.url, f.name)}
                style={{ width: '100%', padding: '4px 0', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ⬇ Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Log Panel ─────────────────────────────────────────────────────────────────
function LogPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wiki/log').then(r => r.json()).then(d => {
      setEntries(Array.isArray(d) ? d : (d.entries || []));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const TYPE_COLORS = { ingest: '#10b981', query: '#6366f1', lint: '#f59e0b', edit: '#0ea5e9' };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Log</h2>
      <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: 14 }}>Cronologia delle operazioni sulla wiki.</p>
      {loading && <p style={{ color: '#64748b' }}>Caricamento...</p>}
      {!loading && entries.length === 0 && <p style={{ color: '#475569' }}>Nessuna operazione registrata.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e, i) => (
          <div key={e.id || i} style={{ padding: '12px 16px', background: '#1e293b', borderRadius: 10, borderLeft: `3px solid ${TYPE_COLORS[e.type] || '#64748b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[e.type] || '#64748b' }}>{e.type?.toUpperCase()}</span>
              <span style={{ fontSize: 11, color: '#475569' }}>{new Date(e.timestamp).toLocaleString('it-IT')}</span>
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{e.title}</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{e.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page Modal ────────────────────────────────────────────────────────────────
function PageModal({ page, onClose }) {
  if (!page) return null;
  const meta = TYPE_META[page.type] || {};
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', border: `1px solid ${meta.color || '#334155'}44` }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: (meta.color || '#64748b') + '22', color: meta.color || '#64748b', marginRight: 10 }}>
              {meta.icon} {meta.label}
            </span>
            <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 17 }}>{page.title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: 14 }}>
            <ReactMarkdown>{page.content || ''}</ReactMarkdown>
          </div>
          {page.tags?.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {page.tags.map(t => (
                <span key={t} style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, background: '#0f172a', color: '#64748b', border: '1px solid #334155' }}>#{t}</span>
              ))}
            </div>
          )}
          {page.related?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span style={{ color: '#64748b', fontSize: 12 }}>Refs: </span>
              {page.related.map(r => (
                <span key={r} style={{ marginRight: 6, color: '#6366f1', fontSize: 12 }}>{r}</span>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, color: '#475569', fontSize: 11 }}>
            {page.wordCount} parole · {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('it-IT') : ''}
            {page.sourceRef && ` · Fonte: ${page.sourceRef}`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WikiPage() {
  const [tab, setTab] = useState('ingest');
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [loadingPages, setLoadingPages] = useState(true);

  async function loadPages() {
    const data = await fetch('/api/wiki/list').then(safeJson);
    setPages(Array.isArray(data) ? data : (data.pages || []));
    setLoadingPages(false);
  }

  useEffect(() => { loadPages(); }, []);

  const filteredPages = pages.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const TABS = [
    { id: 'ingest', label: '📥 Ingest' },
    { id: 'query',  label: '🔍 Query' },
    { id: 'files',  label: '📁 Files' },
    { id: 'lint',   label: '🔧 Lint' },
    { id: 'log',    label: '📋 Log' },
  ];

  return (
    <>
      <Head><title>Second Brain · Aethersy-AI</title></Head>
      <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, background: '#0a0f1e' }}>
          <Link href="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
          <span style={{ color: '#1e293b' }}>|</span>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🧠 Second Brain
          </span>
          <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 13 }}>{pages.length} pagine</span>
        </div>

        <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>

          {/* Sidebar */}
          <div style={{ width: 260, borderRight: '1px solid #1e293b', background: '#080d1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cerca pagine..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#1e293b', color: '#f1f5f9', fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #1e293b', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <button onClick={() => setFilterType('all')} style={{ padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: filterType === 'all' ? '#6366f1' : '#1e293b', color: filterType === 'all' ? '#fff' : '#64748b' }}>ALL</button>
              {Object.entries(TYPE_META).map(([type, meta]) => (
                <button key={type} onClick={() => setFilterType(type === filterType ? 'all' : type)} style={{ padding: '3px 8px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: filterType === type ? meta.color + '33' : '#1e293b', color: filterType === type ? meta.color : '#64748b' }}>
                  {meta.icon}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingPages && <p style={{ padding: 16, color: '#475569', fontSize: 12 }}>Caricamento...</p>}
              {!loadingPages && filteredPages.length === 0 && (
                <p style={{ padding: 16, color: '#334155', fontSize: 12, textAlign: 'center' }}>
                  {pages.length === 0 ? 'Wiki vuota' : 'Nessun risultato'}
                </p>
              )}
              {filteredPages.map(p => {
                const meta = TYPE_META[p.type] || {};
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPage(p)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 10 }}>{meta.icon}</span>
                      <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: 10 }}>{p.wordCount || 0}w · {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('it-IT') : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e293b', background: '#080d1a' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{ padding: '14px 24px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', color: tab === t.id ? '#6366f1' : '#475569', borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
              {tab === 'ingest' && <IngestPanel onDone={loadPages} />}
              {tab === 'query'  && <QueryPanel pages={pages} />}
              {tab === 'files'  && <FilesPanel />}
              {tab === 'lint'   && <LintPanel />}
              {tab === 'log'    && <LogPanel />}
            </div>
          </div>
        </div>
      </div>

      {selectedPage && <PageModal page={selectedPage} onClose={() => setSelectedPage(null)} />}
    </>
  );
}
