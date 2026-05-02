/**
 * AI Tools Dashboard - 80+ Strumenti AI
 * Aethersy AI Platform
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  pricing: { type: string; amount?: number; currency?: string };
  features: string[];
  status: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  rating: number;
  downloads: number;
  premium: boolean;
  credits: number;
}

export default function ToolsDashboard() {
  const [activeTab, setActiveTab] = useState<'tools' | 'templates'>('tools');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<AITool[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/tools/registry');
      const data = await res.json();
      setStats(data.stats);
      setTools(data.featuredTools || []);
      setTemplates(data.topTemplates || []);
      setCategories(data.categories?.tools || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => {
    if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
    if (searchQuery && !tool.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento strumenti AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white">{stats?.totalTools || 80}+</div>
            <div className="text-purple-300 text-sm">Strumenti AI</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white">{stats?.totalTemplates || 10000}+</div>
            <div className="text-purple-300 text-sm">Template</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white">{stats?.categories?.tools || 10}</div>
            <div className="text-purple-300 text-sm">Categorie Tools</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white">{stats?.freeTools || 25}</div>
            <div className="text-purple-300 text-sm">Strumenti Gratuiti</div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('tools'); setSelectedCategory('all'); }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'tools'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🛠️ Strumenti AI
            </button>
            <button
              onClick={() => { setActiveTab('templates'); setSelectedCategory('all'); }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'templates'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              📄 Template
            </button>
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder={`Cerca ${activeTab === 'tools' ? 'strumenti' : 'template'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-auto px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Tutti
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => (
              <div
                key={tool.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                    <span className="text-xs text-purple-300">{tool.category}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tool.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    tool.status === 'beta' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {tool.status === 'active' ? '✓' : tool.status === 'beta' ? '🧪' : '✕'} {tool.status}
                  </span>
                </div>

                <p className="text-white/70 text-sm mb-4">{tool.description}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {tool.features.slice(0, 3).map((feature, i) => (
                    <span key={i} className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                  {tool.features.length > 3 && (
                    <span className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded">
                      +{tool.features.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    tool.pricing.type === 'free' ? 'text-green-400' :
                    tool.pricing.type === 'credits' ? 'text-purple-400' :
                    'text-yellow-400'
                  }`}>
                    {tool.pricing.type === 'free' ? 'Gratis' :
                     tool.pricing.type === 'credits' ? `${tool.pricing.amount} credits` :
                     `€${tool.pricing.amount}/mese`}
                  </span>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all">
                    Usa ora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Templates Grid */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white truncate">{template.name}</h3>
                  <span className="text-xs text-purple-300">{template.category}</span>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="text-yellow-400">⭐ {template.rating}</span>
                  <span className="text-white/60">⬇️ {template.downloads.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.premium && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                        👑 Premium
                      </span>
                    )}
                    <span className="text-sm text-purple-400">{template.credits} credits</span>
                  </div>
                  <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-all">
                    Scarica
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'tools' && filteredTools.length === 0) ||
          (activeTab === 'templates' && filteredTemplates.length === 0)) && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Nessun risultato trovato</h3>
            <p className="text-white/70">Prova a modificare i filtri o la ricerca</p>
          </div>
        )}
      </main>
    </div>
  );
}
