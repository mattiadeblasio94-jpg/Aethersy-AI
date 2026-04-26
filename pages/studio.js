import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// ─── Viral Prompt Libraries ───────────────────────────────────────────────────

const VIRAL = {
  image: [
    { label: '🧑‍🚀 Astronauta Terrarium', prompt: 'Tiny astronaut exploring a glowing terrarium cosmos, golden bokeh light, macro photography, 8K cinematic' },
    { label: '🌊 Palazzo Sommerso', prompt: 'Abandoned baroque palace deep underwater, chandeliers with bioluminescent jellyfish, rays of sunlight, epic cinematic' },
    { label: '⚔️ Samurai Cyber', prompt: 'Lone samurai in neon-lit cyberpunk Tokyo alley at night, rain reflections, katana drawn, dramatic cinematic lighting' },
    { label: '💫 Ritratto Galattico', prompt: 'Portrait of a woman whose hair transforms into a flowing galaxy and stardust, high fashion editorial, ethereal' },
    { label: '🌋 Cristalli Bioluminescenti', prompt: 'Vast crystal cave filled with glowing bioluminescent flora and floating particles, fantasy concept art, ultra detailed' },
    { label: '🏛️ Tempio nella Foresta', prompt: 'Ancient stone temple completely reclaimed by lush tropical forest, golden light beams through canopy, misty atmosphere' },
    { label: '🌪️ Modella nel Deserto', prompt: 'Model in flowing silver metallic dress in the middle of a lightning storm in the Sahara, high fashion, dramatic' },
    { label: '🐉 Drago all\'Alba', prompt: 'Dragon skeleton rising from morning fog over a mountain valley, fantasy, cinematic lighting, golden hour' },
  ],
  video: [
    { label: '🌁 Golden Gate nella Nebbia', prompt: 'Golden Gate Bridge slowly emerging from thick morning fog in extreme slow motion, sunrise light breaking through' },
    { label: '🦋 Campo di Lucciole', prompt: 'Vast field of fireflies rising into a starry night sky above a quiet lake, magical, timelapse' },
    { label: '🌋 Lava nell\'Oceano', prompt: 'Dramatic lava flow entering the Pacific ocean at dusk, massive steam plume, orange glow, cinematic 4K' },
    { label: '⛈️ Faro nella Tempesta', prompt: 'Lone lighthouse battered by massive storm waves at night, lightning illuminating the sea, dramatic, cinematic' },
    { label: '🌆 Città Day-to-Night', prompt: 'City street transforms from sunny afternoon to neon-lit rainy night, people with umbrellas, beautiful timelapse' },
    { label: '🧊 Grotta di Ghiaccio', prompt: 'Blue ice cave with dramatic light shafts, camera glides forward through crystal formations, cinematic slow motion' },
    { label: '🚀 Astronauta nello Spazio', prompt: 'Astronaut floats through abandoned space station corridor, Earth visible through porthole, ethereal silence' },
    { label: '🌊 Onde Slow Motion', prompt: 'Turquoise waves crashing on black volcanic sand beach in ultra slow motion, water crystals exploding, 4K epic' },
  ],
  music: [
    { label: '🎬 Trailer Epico', prompt: 'Epic cinematic orchestral movie trailer, rising tension, full orchestra, powerful brass, massive choir finale, Hans Zimmer style' },
    { label: '📚 Lo-Fi Studio', prompt: 'Chill lo-fi hip hop for late night studying, mellow jazz piano, vinyl crackle, soft drums, nostalgic rainy evening' },
    { label: '⚡ EDM Festival', prompt: 'Euphoric electronic dance music festival anthem, building energy, massive synth drop, crowd energy, summer vibes' },
    { label: '🎹 Piano Emotivo', prompt: 'Melancholic emotional solo piano in empty concert hall, slow reverb, cinematic, like a movie score memory scene' },
    { label: '🌙 Dark Trap', prompt: 'Dark atmospheric trap beat, haunting 808 bass, hi-hat patterns, drill influenced, moody, professional mix' },
    { label: '🌿 Ambient Meditazione', prompt: 'Peaceful ambient electronic meditation, Tibetan singing bowls, atmospheric pads, slow evolving textures, healing frequencies' },
    { label: '💃 Flamenco Passionale', prompt: 'Intense passionate flamenco guitar with hand clapping and footwork percussion, dramatic, Spain, cinematic' },
    { label: '🔮 Synthwave Neon', prompt: 'Retro 80s synthwave neon noir, pulsing bass, arpeggiated synths, Blade Runner inspired, cinematic drive' },
  ],
};

// ─── Model Definitions ────────────────────────────────────────────────────────

const IMAGE_MODELS = [
  { id: 'schnell', label: 'FLUX Schnell', badge: '⚡ 3s', color: '#10b981', desc: 'Velocissimo, qualità ottima' },
  { id: 'pro',     label: 'FLUX 1.1 Pro', badge: '⭐ PRO', color: '#f59e0b', desc: 'Massima qualità, 15s' },
  { id: 'sdxl',    label: 'SDXL',         badge: '🎨 Art', color: '#8b5cf6', desc: 'Stile artistico, 20s' },
];

const VIDEO_MODELS = [
  { id: 'wan',     label: 'Wan 2.1',       badge: '⚡ Fast', color: '#06b6d4', desc: '480p · ~1-2 min · Alta qualità' },
  { id: 'minimax', label: 'Hailuo Video',  badge: '🎬 Pro',  color: '#6366f1', desc: '720p · ~2-3 min · Cinematografico' },
  { id: 'ltx',     label: 'LTX Video',     badge: '🚀 Ultra',color: '#10b981', desc: '480p · ~1 min · Veloce' },
];

const MUSIC_MODELS = [
  { id: 'stereo-large',        label: 'MusicGen Stereo',  badge: '🔊 Stereo', color: '#f59e0b', desc: 'Alta qualità stereo' },
  { id: 'stereo-melody-large', label: 'MusicGen Melody',  badge: '🎵 Melody', color: '#10b981', desc: 'Segue melodia naturale' },
  { id: 'large',               label: 'MusicGen Large',   badge: '🎶 Large',  color: '#6366f1', desc: 'Modello grande, ricco' },
];

const IMAGE_STYLES = [
  { id: '', label: '✦ Nessuno' },
  { id: 'cinematic lighting, photorealistic, 8K, film grain, anamorphic lens bokeh', label: 'Cinematic' },
  { id: 'anime style, vibrant colors, Makoto Shinkai, highly detailed background', label: 'Anime' },
  { id: 'dark fantasy concept art, dramatic lighting, highly detailed, Greg Rutkowski', label: 'Dark Art' },
  { id: 'minimalist, clean lines, modern design, pastel palette, lots of white space', label: 'Minimal' },
  { id: 'cyberpunk neon aesthetic, rain-soaked streets, futuristic city, Blade Runner', label: 'Cyber' },
  { id: 'hyperrealistic photography, golden hour, professional camera, bokeh background', label: 'Photo' },
  { id: 'oil painting impressionist, thick brushstrokes, vivid colors, museum quality', label: 'Oil Paint' },
  { id: '3D octane render, subsurface scattering, physically based rendering, unreal engine', label: '3D Render' },
];

const VIDEO_STYLES = [
  { id: '', label: '✦ Nessuno' },
  { id: 'epic cinematic camera movement, dramatic lighting, 4K film quality, IMAX', label: 'IMAX Epic' },
  { id: 'slow motion, high frame rate, ultra detailed motion blur, nature documentary BBC', label: 'Slow Motion' },
  { id: 'aerial drone shot, sweeping panorama, golden hour warm light, National Geographic', label: 'Aerial Drone' },
  { id: 'neon noir, rain-soaked streets, cyberpunk city at night, moody color grade', label: 'Neon Noir' },
  { id: 'anime motion, fluid cel animation, vibrant colors, Studio Ghibli inspired', label: 'Anime Motion' },
];

const RATIOS = [
  { id: '1:1',  label: '1:1', sub: 'Square' },
  { id: '16:9', label: '16:9', sub: 'Landscape' },
  { id: '9:16', label: '9:16', sub: 'Portrait' },
  { id: '4:3',  label: '4:3',  sub: 'Classic' },
  { id: '3:2',  label: '3:2',  sub: 'Photo' },
  { id: '2:3',  label: '2:3',  sub: 'Tall' },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function usePoll(predictionId, onDone) {
  const timerRef = useRef(null);
  useEffect(() => {
    if (!predictionId) return;
    async function check() {
      try {
        const r = await fetch(`/api/studio/poll?id=${predictionId}`);
        const d = await r.json();
        if (d.error && d.status !== 'processing' && d.status !== 'starting') { onDone(null, d.error); return; }
        if (d.status === 'succeeded') { onDone(d.url, null); return; }
        if (d.status === 'failed' || d.status === 'canceled') { onDone(null, d.error || 'Generazione fallita'); return; }
      } catch {}
      timerRef.current = setTimeout(check, 3500);
    }
    timerRef.current = setTimeout(check, 3000);
    return () => clearTimeout(timerRef.current);
  }, [predictionId]);
}

function useTimer(active) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) { setS(0); return; }
    const t = setInterval(() => setS(v => v + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}

// ─── Shared Components ────────────────────────────────────────────────────────

function ModelCard({ m, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 10, border: `1px solid ${active ? m.color + '60' : 'rgba(255,255,255,0.07)'}`,
      background: active ? m.color + '15' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#f1f5f9' : '#64748b' }}>{m.label}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: m.color, background: m.color + '20', padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>{m.badge}</span>
      </div>
      <div style={{ fontSize: 10, color: '#475569' }}>{m.desc}</div>
    </button>
  );
}

function Pill({ active, color = '#6366f1', onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      padding: small ? '4px 10px' : '5px 13px', borderRadius: 20,
      border: `1px solid ${active ? color + '70' : 'rgba(255,255,255,0.08)'}`,
      background: active ? color + '18' : 'transparent',
      color: active ? '#e2e8f0' : '#475569', fontSize: small ? 11 : 12,
      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function Section({ label, children, action }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#334155', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function ViralGrid({ prompts, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {prompts.map((p, i) => (
        <button key={i} onClick={() => onSelect(p.prompt)} style={{
          padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.15s', fontSize: 11, color: '#64748b', fontWeight: 500,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#64748b'; }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function BigGenerateBtn({ onClick, loading, elapsed, icon, label }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: '100%', padding: '16px', borderRadius: 12, border: 'none',
      cursor: loading ? 'default' : 'pointer',
      background: loading
        ? 'rgba(99,102,241,0.2)'
        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0891b2 100%)',
      color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.03em',
      boxShadow: loading ? 'none' : '0 0 40px rgba(79,70,229,0.35)',
      transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {loading
        ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Generando... {elapsed}</>
        : <>{icon} {label}</>
      }
    </button>
  );
}

function Canvas({ loading, error, children, type }) {
  const icons = { image: '🖼', video: '🎬', music: '🎵', voice: '🎙' };
  const labels = { image: 'Composizione immagine...', video: 'Rendering video cinematografico...', music: 'Composizione musicale AI...', voice: 'Sintesi voce neurale...' };
  return (
    <div style={{
      flex: 1, minHeight: 480, background: '#020204', borderRadius: 16,
      border: `1px solid ${loading ? 'transparent' : 'rgba(255,255,255,0.05)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
      boxShadow: loading ? '0 0 0 1px #6366f1, 0 0 60px rgba(99,102,241,0.25), inset 0 0 60px rgba(99,102,241,0.05)' : 'none',
    }}>
      {loading && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 20, animation: 'float 2.5s ease-in-out infinite' }}>{icons[type]}</div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{labels[type]}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `dotPulse 1.6s ease-in-out ${i*0.15}s infinite` }} />
            ))}
          </div>
        </div>
      )}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 380 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#f87171', fontSize: 13, lineHeight: 1.6 }}>{error}</p>
        </div>
      )}
      {!loading && !error && children}
      {!loading && !error && !children && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, opacity: 0.08, marginBottom: 12 }}>{icons[type]}</div>
          <p style={{ color: '#1e293b', fontSize: 13 }}>Seleziona un prompt e genera</p>
        </div>
      )}
    </div>
  );
}

function DownloadBtn({ url, ext, label }) {
  return (
    <a href={url} download={`aethersy_${Date.now()}.${ext}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
      color: '#a5b4fc', fontSize: 12, fontWeight: 600, textDecoration: 'none',
    }}>⬇ {label}</a>
  );
}

// ─── Image Tab ────────────────────────────────────────────────────────────────

function ImageTab({ addToHistory }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [ratio, setRatio] = useState('16:9');
  const [model, setModel] = useState('schnell');
  const [loading, setLoading] = useState(false);
  const [predId, setPredId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const elapsed = useTimer(loading);

  usePoll(predId, (url, err) => {
    setLoading(false); setPredId(null);
    if (err) { setError(err); return; }
    setResult(url);
    addToHistory({ type: 'image', url, prompt });
  });

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null); setPredId(null);
    const d = await fetch('/api/studio/image', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, style, ratio, model }) }).then(r=>r.json());
    if (d.error) { setError(d.error); setLoading(false); return; }
    if (d.predictionId) { setPredId(d.predictionId); return; }
    setLoading(false);
    setResult(d.url);
    addToHistory({ type: 'image', url: d.url, prompt });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
      <Canvas loading={loading} error={error} type="image">
        {result && (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:16 }}>
            <img src={result} alt="" style={{ maxWidth:'100%', maxHeight:'calc(100% - 48px)', objectFit:'contain', borderRadius:10 }} />
            <DownloadBtn url={result} ext="webp" label="Download Image" />
          </div>
        )}
      </Canvas>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Section label="MODELLO">
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {IMAGE_MODELS.map(m => <ModelCard key={m.id} m={m} active={model===m.id} onClick={() => setModel(m.id)} />)}
          </div>
        </Section>

        <Section label="PROMPT VIRALI — clicca per caricare">
          <ViralGrid prompts={VIRAL.image} onSelect={p => setPrompt(p)} />
        </Section>

        <Section label="PROMPT">
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)generate()}}
            rows={4} placeholder="Descrivi l'immagine che vuoi creare..." style={inputStyle} />
        </Section>

        <Section label="STILE">
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {IMAGE_STYLES.map(s => <Pill key={s.id} active={style===s.id} onClick={()=>setStyle(s.id)} small>{s.label}</Pill>)}
          </div>
        </Section>

        <Section label="PROPORZIONI">
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {RATIOS.map(r => <Pill key={r.id} active={ratio===r.id} onClick={()=>setRatio(r.id)} small>{r.label} <span style={{opacity:0.5,fontSize:9}}>{r.sub}</span></Pill>)}
          </div>
        </Section>

        <BigGenerateBtn onClick={generate} loading={loading} elapsed={elapsed} icon="🖼" label="Genera Immagine" />
      </div>
    </div>
  );
}

// ─── Video Tab ────────────────────────────────────────────────────────────────

function VideoTab({ addToHistory }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [model, setModel] = useState('wan');
  const [loading, setLoading] = useState(false);
  const [predId, setPredId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const elapsed = useTimer(loading);

  usePoll(predId, (url, err) => {
    setLoading(false); setPredId(null);
    if (err) { setError(err); return; }
    setResult(url);
    addToHistory({ type: 'video', url, prompt });
  });

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null); setPredId(null);
    const d = await fetch('/api/studio/video', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, style, model }) }).then(r=>r.json());
    if (d.error) { setError(d.error); setLoading(false); return; }
    setPredId(d.predictionId);
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>
      <Canvas loading={loading} error={error} type="video">
        {result && (
          <div style={{ width:'100%', padding:16, display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
            <video controls autoPlay loop style={{ maxWidth:'100%', borderRadius:10 }}>
              <source src={result} />
            </video>
            <DownloadBtn url={result} ext="mp4" label="Download Video" />
          </div>
        )}
      </Canvas>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Section label="MODELLO VIDEO">
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {VIDEO_MODELS.map(m => <ModelCard key={m.id} m={m} active={model===m.id} onClick={()=>setModel(m.id)} />)}
          </div>
        </Section>

        <Section label="PROMPT VIRALI — clicca per caricare">
          <ViralGrid prompts={VIRAL.video} onSelect={p=>setPrompt(p)} />
        </Section>

        <Section label="PROMPT">
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4}
            placeholder="Descrivi la scena video che vuoi generare..." style={inputStyle} />
        </Section>

        <Section label="STILE CINEMATOGRAFICO">
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {VIDEO_STYLES.map(s => <Pill key={s.id} active={style===s.id} onClick={()=>setStyle(s.id)} small>{s.label}</Pill>)}
          </div>
        </Section>

        <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.18)' }}>
          <p style={{ color:'#fbbf24', fontSize:11, margin:0, lineHeight:1.6 }}>⏱ Tempo stimato: <strong>{model==='ltx'?'~1 min':model==='wan'?'~1-2 min':'~2-3 min'}</strong>. Il polling continua in background — puoi lasciare aperta la pagina.</p>
        </div>

        <BigGenerateBtn onClick={generate} loading={loading} elapsed={elapsed} icon="🎬" label="Genera Video" />
      </div>
    </div>
  );
}

// ─── Music Tab ────────────────────────────────────────────────────────────────

function MusicTab({ addToHistory }) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('stereo-large');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [predId, setPredId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const elapsed = useTimer(loading);

  usePoll(predId, (url, err) => {
    setLoading(false); setPredId(null);
    if (err) { setError(err); return; }
    setResult(url);
    addToHistory({ type: 'music', url, prompt });
  });

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null); setPredId(null);
    const d = await fetch('/api/studio/music', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, model, duration }) }).then(r=>r.json());
    if (d.error) { setError(d.error); setLoading(false); return; }
    setPredId(d.predictionId);
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>
      <Canvas loading={loading} error={error} type="music">
        {result && (
          <div style={{ width:'100%', padding:40, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
            <div style={{ fontSize:72, animation:'float 3s ease-in-out infinite' }}>🎵</div>
            <div style={{ color:'#94a3b8', fontSize:14, textAlign:'center', maxWidth:320, lineHeight:1.6 }}>{prompt.slice(0,100)}{prompt.length>100?'...':''}</div>
            <audio controls style={{ width:'100%', maxWidth:440 }}>
              <source src={result} />
            </audio>
            <DownloadBtn url={result} ext="wav" label="Download Audio" />
          </div>
        )}
      </Canvas>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Section label="MODELLO MUSICALE">
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {MUSIC_MODELS.map(m => <ModelCard key={m.id} m={m} active={model===m.id} onClick={()=>setModel(m.id)} />)}
          </div>
        </Section>

        <Section label="PRESET GENERE — clicca per caricare">
          <ViralGrid prompts={VIRAL.music} onSelect={p=>setPrompt(p)} />
        </Section>

        <Section label="PROMPT MUSICALE">
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3}
            placeholder="Descrivi il tipo di musica che vuoi generare..." style={inputStyle} />
        </Section>

        <Section label={`DURATA: ${duration}s`}>
          <input type="range" min={5} max={30} value={duration} onChange={e=>setDuration(Number(e.target.value))}
            style={{ width:'100%', accentColor:'#6366f1', cursor:'pointer' }} />
          <div style={{ display:'flex', justifyContent:'space-between', color:'#334155', fontSize:10, marginTop:4 }}>
            <span>5s</span><span>30s max</span>
          </div>
        </Section>

        <BigGenerateBtn onClick={generate} loading={loading} elapsed={elapsed} icon="🎵" label="Componi Musica" />
      </div>
    </div>
  );
}

// ─── Voice Tab ────────────────────────────────────────────────────────────────

const VOICES = [
  { id:'uomo-it', label:'🇮🇹 Uomo IT' }, { id:'donna-it', label:'🇮🇹 Donna IT' },
  { id:'uomo-en', label:'🇺🇸 Uomo EN' }, { id:'donna-en', label:'🇺🇸 Donna EN' },
  { id:'narrator', label:'🎙 Narrator' }, { id:'whisper', label:'🤫 Whisper' },
];

function VoiceTab({ addToHistory }) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('uomo-it');
  const [loading, setLoading] = useState(false);
  const [predId, setPredId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const elapsed = useTimer(loading);

  usePoll(predId, (url, err) => {
    setLoading(false); setPredId(null);
    if (err) { setError(err); return; }
    setResult(url);
    addToHistory({ type:'voice', url, prompt: text.slice(0,60) });
  });

  async function generate() {
    if (!text.trim()) return;
    setLoading(true); setError(''); setResult(null); setPredId(null);
    const d = await fetch('/api/studio/voice', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, voice }) }).then(r=>r.json());
    if (d.error) { setError(d.error); setLoading(false); return; }
    setPredId(d.predictionId);
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>
      <Canvas loading={loading} error={error} type="voice">
        {result && (
          <div style={{ width:'100%', padding:40, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
            <div style={{ fontSize:72, animation:'float 3s ease-in-out infinite' }}>🎙</div>
            <div style={{ color:'#64748b', fontSize:13, textAlign:'center', maxWidth:380, lineHeight:1.8, fontStyle:'italic' }}>"{text.slice(0,150)}{text.length>150?'...':''}"</div>
            <audio controls style={{ width:'100%', maxWidth:440 }}>
              <source src={result} />
            </audio>
            <DownloadBtn url={result} ext="wav" label="Download Voice" />
          </div>
        )}
      </Canvas>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Section label="VOCE">
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {VOICES.map(v => <Pill key={v.id} active={voice===v.id} onClick={()=>setVoice(v.id)}>{v.label}</Pill>)}
          </div>
        </Section>

        <Section label="TESTO">
          <textarea value={text} onChange={e=>setText(e.target.value)} rows={8}
            placeholder="Inserisci il testo da sintetizzare in voce..." style={inputStyle} />
          <div style={{ textAlign:'right', color:'#334155', fontSize:10, marginTop:4 }}>{text.length} caratteri</div>
        </Section>

        <BigGenerateBtn onClick={generate} loading={loading} elapsed={elapsed} icon="🎙" label="Sintetizza Voce" />
      </div>
    </div>
  );
}

// ─── History Strip ────────────────────────────────────────────────────────────

function History({ items }) {
  if (!items.length) return null;
  return (
    <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:16, marginTop:4 }}>
      <div style={{ color:'#1e293b', fontSize:10, fontWeight:700, letterSpacing:'0.1em', marginBottom:10 }}>CREAZIONI RECENTI</div>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
        {[...items].reverse().map((item,i) => (
          <div key={i} style={{ flexShrink:0, width:72, height:72, borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', background:'#0a0a14', position:'relative' }}>
            {item.type==='image'
              ? <img src={item.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:20 }}>{{video:'🎬',music:'🎵',voice:'🎙'}[item.type]}</span>
                  <span style={{ fontSize:8, color:'#334155', padding:'0 4px', textAlign:'center', marginTop:2 }}>{item.prompt?.slice(0,18)}</span>
                </div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle = {
  width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.09)',
  borderRadius:10, color:'#f1f5f9', padding:'11px 13px', fontSize:13, resize:'vertical',
  fontFamily:'inherit', lineHeight:1.7, boxSizing:'border-box', outline:'none',
};

const TABS = [
  { id:'image', icon:'🖼', label:'Image AI', sub:'FLUX · SDXL' },
  { id:'video', icon:'🎬', label:'Video AI', sub:'Wan · Hailuo · LTX' },
  { id:'music', icon:'🎵', label:'Music AI', sub:'MusicGen' },
  { id:'voice', icon:'🎙', label:'Voice AI', sub:'Bark Neural TTS' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Studio() {
  const [tab, setTab] = useState('image');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem('studio_history')||'[]')); } catch {}
  }, []);

  function addToHistory(item) {
    setHistory(prev => {
      const next = [...prev, { ...item, timestamp: Date.now() }].slice(-30);
      try { localStorage.setItem('studio_history', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return (
    <>
      <Head><title>Aethersy Studio ✨</title></Head>
      <style>{`
        *{box-sizing:border-box} body{margin:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes dotPulse{0%,80%,100%{opacity:0.15;transform:scale(0.7)}40%{opacity:1;transform:scale(1.2)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        textarea:focus{border-color:rgba(99,102,241,0.5)!important;outline:none}
        textarea::-webkit-scrollbar{width:3px}
      `}</style>

      <div style={{
        minHeight:'100vh', background:'#030305', color:'#f1f5f9',
        fontFamily:"'Inter',system-ui,sans-serif",
        backgroundImage:'radial-gradient(ellipse at 10% 60%,rgba(99,102,241,0.1) 0%,transparent 50%),radial-gradient(ellipse at 90% 15%,rgba(6,182,212,0.07) 0%,transparent 45%)',
      }}>

        {/* Header */}
        <header style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 28px', display:'flex', alignItems:'center', height:54, gap:20, position:'sticky', top:0, background:'rgba(3,3,5,0.92)', backdropFilter:'blur(24px)', zIndex:20 }}>
          <Link href="/dashboard" style={{ color:'#334155', textDecoration:'none', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>← Dashboard</Link>
          <div style={{ width:1, height:18, background:'rgba(255,255,255,0.06)' }} />
          <span style={{ fontWeight:900, fontSize:16, background:'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.02em' }}>✨ Aethersy Studio</span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['FLUX','Wan 2.1','Hailuo','LTX','MusicGen','Bark'].map(t => (
              <span key={t} style={{ fontSize:9, fontWeight:700, color:'#334155', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.05)' }}>{t}</span>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 28px', display:'flex', gap:2, background:'rgba(2,2,4,0.7)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'13px 18px', border:'none', background:'transparent', cursor:'pointer',
              borderBottom:`2px solid ${tab===t.id?'#6366f1':'transparent'}`, transition:'all 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:tab===t.id?'#e2e8f0':'#475569' }}>{t.label}</span>
              </div>
              <div style={{ fontSize:9, color:tab===t.id?'#6366f1':'#1e293b', textAlign:'center', marginTop:1 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:'24px 28px 40px', display:'flex', flexDirection:'column', gap:24, maxWidth:1280, margin:'0 auto' }}>
          {tab==='image' && <ImageTab addToHistory={addToHistory} />}
          {tab==='video' && <VideoTab addToHistory={addToHistory} />}
          {tab==='music' && <MusicTab addToHistory={addToHistory} />}
          {tab==='voice' && <VoiceTab addToHistory={addToHistory} />}
          <History items={history.filter(h=>h.type===tab)} />
        </div>
      </div>
    </>
  );
}
