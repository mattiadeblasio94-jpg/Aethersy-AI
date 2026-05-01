'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PlatformConfig {
  brand_name: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  welcome_message: string;
  telegram_bot_token: string;
  groq_api_key: string;
}

interface BrandConfigProps {
  initialConfig?: Partial<PlatformConfig>;
  onSave?: (config: PlatformConfig) => void;
}

export default function BrandConfig({ initialConfig, onSave }: BrandConfigProps) {
  const [config, setConfig] = useState<PlatformConfig>({
    brand_name: 'Aethersy',
    brand_primary_color: '#00f2ff',
    brand_secondary_color: '#7b2cff',
    welcome_message: 'Benvenuto su Aethersy OS',
    telegram_bot_token: '',
    groq_api_key: '',
    ...initialConfig
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(prev => ({ ...prev, ...initialConfig }));
    }
  }, [initialConfig]);

  const handleChange = (key: keyof PlatformConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setSaved(true);
        onSave?.(config);

        // Aggiorna variabili CSS per il brand
        document.documentElement.style.setProperty('--brand-primary', config.brand_primary_color);
        document.documentElement.style.setProperty('--brand-secondary', config.brand_secondary_color);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleReset = () => {
    setConfig({
      brand_name: 'Aethersy',
      brand_primary_color: '#00f2ff',
      brand_secondary_color: '#7b2cff',
      welcome_message: 'Benvenuto su Aethersy OS',
      telegram_bot_token: '',
      groq_api_key: ''
    });
    setSaved(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">🎨 Brand Configuration</h3>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-400 text-sm"
          >
            ✓ Salvato!
          </motion.span>
        )}
      </div>

      {/* Preview */}
      <div className="mb-6 p-4 rounded-lg border border-gray-800" style={{
        background: `linear-gradient(135deg, ${config.brand_primary_color}22, ${config.brand_secondary_color}22)`
      }}>
        <p className="text-sm text-gray-400 mb-2">Anteprima</p>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded font-medium text-black"
            style={{ background: config.brand_primary_color }}
          >
            Primary
          </button>
          <button
            className="px-4 py-2 rounded font-medium text-white"
            style={{ background: config.brand_secondary_color }}
          >
            Secondary
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Brand Name
          </label>
          <input
            type="text"
            value={config.brand_name}
            onChange={e => handleChange('brand_name', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.brand_primary_color}
                onChange={e => handleChange('brand_primary_color', e.target.value)}
                className="w-12 h-10 rounded cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={config.brand_primary_color}
                onChange={e => handleChange('brand_primary_color', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.brand_secondary_color}
                onChange={e => handleChange('brand_secondary_color', e.target.value)}
                className="w-12 h-10 rounded cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={config.brand_secondary_color}
                onChange={e => handleChange('brand_secondary_color', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Welcome Message
          </label>
          <textarea
            value={config.welcome_message}
            onChange={e => handleChange('welcome_message', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Telegram Bot Token
          </label>
          <input
            type="password"
            value={config.telegram_bot_token}
            onChange={e => handleChange('telegram_bot_token', e.target.value)}
            placeholder="Incolla il token del bot Telegram"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Groq API Key
          </label>
          <input
            type="password"
            value={config.groq_api_key}
            onChange={e => handleChange('groq_api_key', e.target.value)}
            placeholder="Incolla la API key Groq"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: config.brand_primary_color }}
        >
          {loading ? 'Salvataggio...' : 'Salva configurazione'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded font-medium bg-gray-800 hover:bg-gray-700 text-white"
        >
          Reset
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Le modifiche ai colori verranno applicate immediatamente a tutta la dashboard.
      </p>
    </div>
  );
}
