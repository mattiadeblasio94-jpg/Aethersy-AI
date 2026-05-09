/**
 * SKILLS HUB - Tutte le competenze AI di Aethersy
 * Accesso diretto a tutte le skills con esecuzione reale
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = [
  { id: 'all', label: 'Tutte', icon: '🎯' },
  { id: 'document', label: 'Documenti', icon: '📄' },
  { id: 'marketing', label: 'Marketing', icon: '📱' },
  { id: 'data', label: 'Dati', icon: '📊' },
  { id: 'research', label: 'Ricerca', icon: '🌐' },
  { id: 'communication', label: 'Comunicazione', icon: '💬' },
  { id: 'development', label: 'Sviluppo', icon: '💻' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'legal', label: 'Legale', icon: '⚖️' },
  { id: 'finance', label: 'Finanza', icon: '📈' },
  { id: 'business', label: 'Business', icon: '💼' },
];

export default function SkillsHub() {
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [params, setParams] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Auth check
    const stored = localStorage.getItem('aiforge_user');
    if (stored) setUser(JSON.parse(stored));
    else router.push('/');

    // Carica skills
    fetchSkills();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFiltered(skills);
    } else {
      setFiltered(skills.filter(s => s.category === selectedCategory));
    }
  }, [selectedCategory, skills]);

  async function fetchSkills() {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (data.success) setSkills(data.skills);
    } catch (e) {
      console.error('Error loading skills:', e);
    }
  }

  async function executeSkill() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkill.id,
          params,
          context: { userId: user?.id || 'anon' }
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }

    setLoading(false);
  }

  function updateParam(key, value) {
    setParams(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        background: '#111',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#00ff88' }}>🎯 Skills Hub</h1>
          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9rem' }}>
            {skills.length} competenze AI disponibili
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#222',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
        {/* Sidebar - Categories */}
        <aside style={{
          width: '200px',
          background: '#111',
          borderRight: '1px solid #333',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#888', fontSize: '0.8rem', marginBottom: '15px', textTransform: 'uppercase' }}>
            Categorie
          </h3>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                width: '100%',
                padding: '10px 15px',
                marginBottom: '8px',
                borderRadius: '8px',
                border: 'none',
                background: selectedCategory === cat.id ? '#00ff8822' : 'transparent',
                color: selectedCategory === cat.id ? '#00ff88' : '#888',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.9rem'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </aside>

        {/* Main - Skills Grid */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {!selectedSkill ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {filtered.map(skill => (
                  <div
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill)}
                    style={{
                      padding: '20px',
                      background: '#1a1a1a',
                      borderRadius: '12px',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: '#00ff88',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{skill.icon}</div>
                    <h3 style={{ margin: '0 0 10px', color: '#fff' }}>{skill.name}</h3>
                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '15px', lineHeight: 1.5 }}>
                      {skill.description}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(skill.parameters).slice(0, 3).map(([key, schema]) => (
                        <span
                          key={key}
                          style={{
                            padding: '4px 8px',
                            background: '#222',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#666'
                          }}
                        >
                          {schema.required ? '🔴' : '🟢'} {key}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '100px' }}>
                  <p>Nessuna skill trovata in questa categoria</p>
                </div>
              )}
            </>
          ) : (
            /* Skill Detail & Execution */
            <div style={{ maxWidth: '800px' }}>
              <button
                onClick={() => {
                  setSelectedSkill(null);
                  setResult(null);
                  setParams({});
                }}
                style={{
                  padding: '10px 20px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#222',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                ← Torna alle skills
              </button>

              <div style={{
                padding: '25px',
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '3rem' }}>{selectedSkill.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, color: '#fff' }}>{selectedSkill.name}</h2>
                    <p style={{ margin: '5px 0 0', color: '#888' }}>{selectedSkill.description}</p>
                  </div>
                </div>

                {/* Parameters Form */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#00ff88', fontSize: '1rem', marginBottom: '15px' }}>Parametri</h3>
                  {Object.entries(selectedSkill.parameters).map(([key, schema]) => (
                    <div key={key} style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>
                        {key} {schema.required && <span style={{ color: '#ff4444' }}>*</span>}
                      </label>
                      {schema.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={!!params[key]}
                          onChange={e => updateParam(key, e.target.checked)}
                          style={{ marginRight: '10px' }}
                        />
                      ) : schema.enum ? (
                        <select
                          value={params[key] || ''}
                          onChange={e => updateParam(key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            background: '#222',
                            border: '1px solid #333',
                            color: '#fff'
                          }}
                        >
                          <option value="">Seleziona...</option>
                          {schema.enum.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={schema.type === 'number' ? 'number' : 'text'}
                          value={params[key] || ''}
                          onChange={e => updateParam(key, e.target.value)}
                          placeholder={schema.description}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            background: '#222',
                            border: '1px solid #333',
                            color: '#fff',
                            boxSizing: 'border-box'
                          }}
                        />
                      )}
                      {schema.description && (
                        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                          {schema.description}
                        </small>
                      )}
                    </div>
                  ))}
                </div>

                {/* Execute Button */}
                <button
                  onClick={executeSkill}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '8px',
                    border: 'none',
                    background: loading ? '#333' : '#00ff88',
                    color: loading ? '#666' : '#000',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {loading ? '⏳ Esecuzione...' : `🚀 Esegui ${selectedSkill.name}`}
                </button>

                {/* Result */}
                {result && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: result.error ? '#ff444422' : '#00ff8822',
                    borderRadius: '8px',
                    border: `1px solid ${result.error ? '#ff4444' : '#00ff88'}`
                  }}>
                    <h3 style={{ color: result.error ? '#ff4444' : '#00ff88', marginTop: 0 }}>
                      {result.error ? '❌ Errore' : '✅ Risultato'}
                    </h3>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                      {result.error ? result.error : JSON.stringify(result, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
