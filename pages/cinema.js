import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Cinematic prompt presets ────────────────────────────────────────────────

const PRESETS = {
  video: [
    { label: '🌊 Ocean Storm', prompt: 'Massive ocean waves crashing against rocky cliffs at golden hour, cinematic slow motion, dramatic lighting, 8K footage' },
    { label: '🏙 Neo Tokyo', prompt: 'Futuristic neon-lit Tokyo street at night, cyberpunk aesthetic, rain reflections, hovering vehicles, cinematic tracking shot' },
    { label: '🌌 Space Odyssey', prompt: 'Spacecraft emerging from hyperspace near a massive gas giant, volumetric light rays, photorealistic, IMAX quality' },
    { label: '🦁 Wildlife Savanna', prompt: 'Pride of lions on African savanna at sunset, drone aerial shot, golden hour, National Geographic quality' },
    { label: '🌋 Volcanic Dawn', prompt: 'Active volcano erupting at dawn, lava rivers flowing, ash clouds illuminated by lightning, cinematic epic scale' },
    { label: '🏔 Mountain Flight', prompt: 'First-person drone flight through narrow fjord between towering snow-capped mountains, crystal clear water below, Norway' },
    { label: '🌸 Cherry Blossom', prompt: 'Cherry blossom petals falling in slow motion through Japanese temple garden, sakura, zen, cinematic depth of field' },
    { label: '⚡ Thunder City', prompt: 'Timelapse of massive thunderstorm rolling over Manhattan skyline, lightning strikes, purple electric sky, cinematic' },
    { label: '🌊 Underwater World', prompt: 'Sunlight rays piercing through ocean surface revealing coral reef ecosystem, slow motion, documentary style, vivid colors' },
    { label: '🚀 Launch Sequence', prompt: 'SpaceX rocket launching at night, massive fire column, shockwave ripple through atmosphere, cinematic close-up' },
    { label: '❄️ Arctic Aurora', prompt: 'Northern lights aurora borealis dancing above frozen tundra, time lapse, stars milky way visible, magical atmosphere' },
    { label: '🎭 Cinematic Portrait', prompt: 'Close-up portrait of a woman, dramatic chiaroscuro lighting, cinematic film grain, emotional expression, golden ratio' },
  ],
  image: [
    { label: '🌅 Cinematic Landscape', prompt: 'Ultra-wide cinematic landscape, dramatic sky, volumetric god rays, photorealistic, 8K, award-winning photography' },
    { label: '🤖 AI Portrait', prompt: 'Hyper-realistic portrait of a futuristic AI entity, chrome and light, ethereal glow, ultra detailed, octane render' },
    { label: '🏛 Ancient Ruins', prompt: 'Lost ancient temple overgrown by jungle, mystical light, Indiana Jones vibe, cinematic composition, photorealistic' },
    { label: '🌆 Dystopian City', prompt: 'Dystopian megacity at night, acid rain, neon lights, smog, flying vehicles, Blade Runner aesthetic, cinematic' },
    { label: '🧬 Bio Art', prompt: 'Microscopic world rendered as art, DNA helix with bioluminescent glow, macro photography style, scientific beauty' },
    { label: '⚡ Storm God', prompt: 'God of thunder summoning lightning storm over ocean, mythological epic, dramatic composition, ultra cinematic' },
    { label: '🌊 Frozen Wave', prompt: 'Massive wave frozen in time at the moment of breaking, crystal clear water, backlit by sunset, photorealistic' },
    { label: '🦋 Metamorphosis', prompt: 'Butterfly emerging from chrysalis, macro close-up, morning dew drops, golden hour light, award-winning nature photo' },
    { label: '🏔 The Void', prompt: 'Astronaut standing on edge of black hole event horizon, space, stars, quantum foam, digital art masterpiece' },
    { label: '🎨 Oil Masterpiece', prompt: 'Baroque oil painting style, dramatic chiaroscuro, rich textures, museum quality, Old Masters technique' },
    { label: '🌺 Neon Garden', prompt: 'Bioluminescent neon flower garden at night, glowing petals, alien world aesthetic, ultra detailed, vibrant colors' },
    { label: '👁 Surreal Eye', prompt: 'Surrealist giant eye overlooking a miniature city, Salvador Dalí style, ultra detailed, dreamlike, impossible perspective' },
  ],
};

const VIDEO_MODELS = [
  { id: 'wan', label: 'Wan 2.1', badge: '⚡ Fast', provider: 'Replicate', desc: 'Wan 2.1 - Best open-source video AI. Fast & reliable per testing e produzione.', color: '#10b981' },
  { id: 'ltx', label: 'LTX Video', badge: '🚀 Ultra-fast', provider: 'Replicate', desc: 'LTX Video - Lightricks model. Generazione ultra-rapida per iterazioni veloci.', color: '#7c3aed' },
];

const IMAGE_MODELS = [
  { id: 'flux-pro-r', label: 'FLUX Pro 1.1', badge: '🏆 Best', provider: 'Replicate', desc: 'FLUX 1.1 Pro - Massima qualità professionale. Dettaglio eccezionale e realismo.', color: '#f59e0b' },
  { id: 'schnell', label: 'FLUX Schnell', badge: '⚡ Instant', provider: 'Replicate', desc: 'FLUX Schnell - Generazione istantanea in 4 step. Perfetto per test rapidi.', color: '#10b981' },
];

const RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9'];
const VIDEO_STYLES = ['', 'cinematic, 4K, film grain', 'hyperrealistic, photographic', 'anime style, Studio Ghibli', 'noir film, black and white', 'drone aerial shot, epic scale'];
const IMAGE_STYLES = ['', 'photorealistic, 8K, RAW photo', 'cinematic still, film photography', 'oil painting, museum quality', 'cyberpunk, neon, digital art', 'minimalist, clean, editorial'];

function useTimer(running) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) { setSecs(0); ref.current = setInterval(() => setSecs(s => s + 1), 1000); }
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  return secs;
}

function usePoll({ jobId, provider, modelId, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!jobId) return;
    ref.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/cinema/status?jobId=${jobId}&provider=${provider}&modelId=${encodeURIComponent(modelId || '')}`);
        const data = await r.json();
        if (data.status === 'succeeded' || data.status === 'failed') {
          clearInterval(ref.current);
          onDone(data);
        }
      } catch {}
    }, 3500);
    return () => clearInterval(ref.current);
  }, [jobId]);
}

function HistoryItem({ item, onSelect }) {
  return (
    <div style={S.histItem} onClick={() => onSelect(item)}>
      {item.type === 'video'
        ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        : <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      }
      <div style={S.histOverlay}>{item.model}</div>
    </div>
  );
}

export default function Cinema() {
  const [tab, setTab] = useState('video');
  const [videoModel, setVideoModel] = useState('wan');
  const [imageModel, setImageModel] = useState('schnell');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [ratio, setRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);

  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [history, setHistory] = useState([]);

  const elapsed = useTimer(loading);

  usePoll({
    jobId: job?.jobId,
    provider: job?.provider,
    modelId: job?.modelId,
    onDone: (data) => {
      setLoading(false);
      setJob(null);
      if (data.status === 'succeeded' && data.url) {
        const item = { url: data.url, type: tab, model: tab === 'video' ? videoModel : imageModel, ts: Date.now() };
        setResult(item);
        setHistory(h => [item, ...h].slice(0, 20));
      } else {
        setErr(data.error || 'Generation failed');
      }
    },
  });

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setResult(null); setErr(''); setJob(null);
    const model = tab === 'video' ? videoModel : imageModel;
    try {
      const res = await fetch('/api/cinema/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, model, ratio, duration }),
      });
      const data = await res.json();
      if (data.error) { setErr(data.error); setLoading(false); return; }
      if (data.done) {
        const item = { url: data.url, type: tab, model, ts: Date.now() };
        setResult(item); setLoading(false);
        setHistory(h => [item, ...h].slice(0, 20));
      } else {
        setJob({ jobId: data.jobId, provider: data.provider, modelId: data.modelId });
      }
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  function download() {
    if (!result?.url) return;
    const ext = result.type === 'video' ? 'mp4' : 'jpg';
    const a = document.createElement('a');
    a.href = result.url; a.download = `cinema_${Date.now()}.${ext}`; a.click();
  }

  const models = tab === 'video' ? VIDEO_MODELS : IMAGE_MODELS;
  const selectedModel = tab === 'video' ? videoModel : imageModel;
  const setModel = tab === 'video' ? setVideoModel : setImageModel;
  const styles = tab === 'video' ? VIDEO_STYLES : IMAGE_STYLES;
  const presets = tab === 'video' ? PRESETS.video : PRESETS.image;
  const currentModelCfg = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" style={S.backBtn}>← Dashboard</Link>
          <div style={S.logo}>🎬 Cinema Studio</div>
          <div style={S.logoSub}>AI-Powered Cinematic Generation</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['video', 'image'].map(t => (
            <button key={t} style={{ ...S.tabBtn, ...(tab === t ? S.tabBtnActive : {}) }} onClick={() => { setTab(t); setResult(null); setErr(''); }}>
              {t === 'video' ? '🎬' : '🖼'} {t === 'video' ? 'Video' : 'Image'}
            </button>
          ))}
        </div>
      </header>

      <div style={S.body}>
        {/* Left: controls */}
        <div style={S.controls}>
          {/* Model selection */}
          <div style={S.section}>
            <div style={S.sectionLabel}>MODEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {models.map(m => (
                <button key={m.id}
                  style={{ ...S.modelCard, ...(selectedModel === m.id ? { ...S.modelCardActive, borderColor: m.color } : {}) }}
                  onClick={() => setModel(m.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: selectedModel === m.id ? m.color : '#e2e8f0' }}>{m.label}</span>
                    <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                      <span style={{ ...S.badge, background: `${m.color}22`, color: m.color }}>{m.badge}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4 }}>{m.desc}</div>
                  <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.2rem' }}>via {m.provider}{m.needsFal ? ' • FAL_KEY req.' : ''}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio */}
          <div style={S.section}>
            <div style={S.sectionLabel}>ASPECT RATIO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {RATIOS.map(r => (
                <button key={r} style={{ ...S.pill, ...(ratio === r ? { ...S.pillActive, borderColor: currentModelCfg.color, color: currentModelCfg.color } : {}) }}
                  onClick={() => setRatio(r)}>{r}</button>
              ))}
            </div>
          </div>

          {/* Duration (video only) */}
          {tab === 'video' && (
            <div style={S.section}>
              <div style={S.sectionLabel}>DURATION: {duration}s</div>
              <input type="range" min={3} max={10} value={duration} onChange={e => setDuration(+e.target.value)}
                style={{ width: '100%', accentColor: currentModelCfg.color }} />
            </div>
          )}

          {/* Style presets */}
          <div style={S.section}>
            <div style={S.sectionLabel}>STYLE</div>
            <select style={S.select} value={style} onChange={e => setStyle(e.target.value)}>
              {styles.map((s, i) => <option key={i} value={s}>{s || '— None —'}</option>)}
            </select>
          </div>
        </div>

        {/* Center: prompt + output */}
        <div style={S.center}>
          {/* Prompt area */}
          <div style={S.promptSection}>
            <textarea
              style={{ ...S.promptArea, borderColor: loading ? `${currentModelCfg.color}66` : 'rgba(255,255,255,0.07)' }}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your cinematic vision...\n\nEx: Massive waves crashing against lighthouse at sunset, slow motion, cinematic, 4K"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) generate(); }}
            />
            <div style={S.promptRow}>
              <span style={{ color: '#334155', fontSize: '0.7rem' }}>Ctrl+Enter to generate • {prompt.length} chars</span>
              {loading
                ? <button style={{ ...S.genBtn, background: '#ef4444' }} onClick={() => { setLoading(false); setJob(null); }}>
                    ■ Cancel ({elapsed}s)
                  </button>
                : <button style={{ ...S.genBtn, background: `linear-gradient(135deg,${currentModelCfg.color},#06b6d4)`, opacity: !prompt.trim() ? 0.5 : 1 }}
                    onClick={generate} disabled={!prompt.trim()}>
                    {tab === 'video' ? '🎬' : '🖼'} Generate
                  </button>
              }
            </div>
          </div>

          {/* Output canvas */}
          <div style={S.canvas}>
            {loading && (
              <div style={S.loadingState}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentModelCfg.needsFal ? '🎬' : '⚡'}</div>
                <div style={{ color: currentModelCfg.color, fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>
                  {currentModelCfg.label}
                </div>
                <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Generating your cinematic vision…</div>
                <div style={S.progressBar}>
                  <div style={{ ...S.progressFill, background: currentModelCfg.color, animation: 'shimmer 2s infinite' }} />
                </div>
                <div style={{ color: '#334155', fontSize: '0.75rem', marginTop: '0.8rem' }}>{elapsed}s elapsed</div>
              </div>
            )}

            {err && !loading && (
              <div style={S.errState}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>⚠️</div>
                <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.3rem' }}>Generation Failed</div>
                <div style={{ color: '#475569', fontSize: '0.82rem', maxWidth: 400, textAlign: 'center' }}>{err}</div>
                <button style={{ ...S.pill, marginTop: '1rem', cursor: 'pointer' }} onClick={() => setErr('')}>Dismiss</button>
              </div>
            )}

            {result && !loading && !err && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000' }}>
                  {result.type === 'video'
                    ? <video src={result.url} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%', outline: 'none' }} />
                    : <img src={result.url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  }
                </div>
                <div style={S.resultBar}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>via {currentModelCfg.label}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={S.outBtn} onClick={download}>⬇ Download</button>
                    <button style={S.outBtn} onClick={async () => {
                      await fetch('/api/wiki/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: `Cinema generation: ${prompt}\n\nModel: ${result.model}\nURL: ${result.url}`, title: `Cinema: ${prompt.slice(0, 60)}` }) });
                    }}>🧠 Save</button>
                  </div>
                </div>
              </div>
            )}

            {!result && !loading && !err && (
              <div style={S.emptyCanvas}>
                <div style={{ fontSize: '4rem', marginBottom: '0.8rem', opacity: 0.3 }}>{tab === 'video' ? '🎬' : '🖼'}</div>
                <div style={{ color: '#334155', fontSize: '0.9rem' }}>Your cinematic creation will appear here</div>
              </div>
            )}
          </div>

          {/* History strip */}
          {history.length > 0 && (
            <div style={S.histStrip}>
              {history.map((item, i) => (
                <HistoryItem key={`${item.ts}-${i}`} item={item} onSelect={r => setResult(r)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: prompt presets */}
        <div style={S.presets}>
          <div style={S.sectionLabel}>CINEMATIC PRESETS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', flex: 1 }}>
            {presets.map((p, i) => (
              <button key={i} style={S.presetCard} onClick={() => setPrompt(p.prompt)}>
                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '0.2rem' }}>{p.label}</div>
                <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4 }}>{p.prompt.slice(0, 80)}…</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.6; transform: scaleX(0.7); }
          50% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0.6; transform: scaleX(0.7); }
        }
      `}</style>
    </div>
  );
}

const S = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#04040a', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' },

  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#060610', flexShrink: 0 },
  backBtn: { color: '#475569', fontSize: '0.75rem', textDecoration: 'none' },
  logo: { fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoSub: { color: '#334155', fontSize: '0.7rem' },
  tabBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', borderRadius: 10, padding: '0.4rem 1rem', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  tabBtnActive: { background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' },

  body: { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },

  controls: { width: 240, background: '#060610', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  sectionLabel: { color: '#1e293b', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em' },
  modelCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.6rem 0.7rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' },
  modelCardActive: { background: 'rgba(255,255,255,0.05)' },
  badge: { borderRadius: 6, padding: '0.1rem 0.45rem', fontSize: '0.63rem', fontWeight: 700, whiteSpace: 'nowrap' },
  pill: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', borderRadius: 8, padding: '0.25rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' },
  pillActive: { background: 'rgba(255,255,255,0.08)', fontWeight: 700 },
  select: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#94a3b8', padding: '0.4rem 0.6rem', fontSize: '0.78rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' },

  center: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  promptSection: { padding: '0.7rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  promptArea: { width: '100%', height: 80, background: 'rgba(255,255,255,0.02)', border: '1px solid', borderRadius: 10, color: '#f1f5f9', padding: '0.65rem 0.8rem', fontSize: '0.85rem', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color 0.2s' },
  promptRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' },
  genBtn: { color: '#fff', border: 'none', borderRadius: 10, padding: '0.45rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  canvas: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: '#030308' },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  progressBar: { width: 220, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, transformOrigin: 'left' },
  errState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  emptyCanvas: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1e293b' },
  resultBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.6)', flexShrink: 0 },
  outBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 7, padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' },

  histStrip: { display: 'flex', gap: '0.4rem', padding: '0.4rem 0.6rem', background: '#050510', borderTop: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', flexShrink: 0, height: 64 },
  histItem: { width: 80, height: 52, flexShrink: 0, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' },
  histOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#94a3b8', fontSize: '0.55rem', padding: '1px 3px', textAlign: 'center' },

  presets: { width: 220, background: '#060610', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  presetCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 9, padding: '0.55rem 0.7rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', fontFamily: 'inherit' },
};
