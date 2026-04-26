// lib/models.ts
// Aethersy-AI — Registry centrale modelli + selezione automatica

import { OllamaModel } from './ollama';

// ─── REGISTRY MODELLI ─────────────────────────────────────────────

export interface ModelConfig {
  id: OllamaModel;
  name: string;
  description: string;
  size: string;
  strengths: string[];
  contextWindow: number;
  recommended: boolean;
}

export const MODELS: ModelConfig[] = [
  {
    id: 'llama3.3:70b',
    name: 'Llama 3.3 70B',
    description: 'Modello principale — conversazione avanzata, ragionamento generale, business',
    size: '42 GB',
    strengths: ['conversazione', 'business', 'strategia', 'generale'],
    contextWindow: 128000,
    recommended: true,
  },
  {
    id: 'deepseek-r1:14b',
    name: 'DeepSeek R1 14B',
    description: 'Modello per ragionamento profondo, analisi complesse, logica',
    size: '9 GB',
    strengths: ['ragionamento', 'analisi', 'matematica', 'logica', 'ricerca'],
    contextWindow: 64000,
    recommended: false,
  },
  {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen 2.5 Coder 7B',
    description: 'Modello specializzato per coding, debug, architettura software',
    size: '4.7 GB',
    strengths: ['codice', 'typescript', 'javascript', 'debug', 'api', 'react'],
    contextWindow: 32000,
    recommended: false,
  },
];

// ─── SELEZIONE AUTOMATICA MODELLO ─────────────────────────────────

export type TaskType =
  | 'coding'
  | 'reasoning'
  | 'business'
  | 'general'
  | 'analysis';

export function selectModelForTask(task: TaskType): OllamaModel {
  switch (task) {
    case 'coding':
      return 'qwen2.5-coder:7b';
    case 'reasoning':
    case 'analysis':
      return 'deepseek-r1:14b';
    case 'business':
    case 'general':
    default:
      return 'llama3.3:70b';
  }
}

export function detectTaskFromMessage(message: string): TaskType {
  const lower = message.toLowerCase();

  const codingKeywords = [
    'codice', 'code', 'typescript', 'javascript', 'react', 'bug',
    'debug', 'funzione', 'componente', 'api', 'errore', 'fix',
    'implementa', 'scrivi il codice', 'refactor'
  ];

  const reasoningKeywords = [
    'analizza', 'ragiona', 'perché', 'confronta', 'valuta',
    'calcola', 'matematica', 'logica', 'deduzione', 'stima'
  ];

  const businessKeywords = [
    'business', 'strategia', 'marketing', 'roi', 'revenue',
    'clienti', 'campagna', 'vendite', 'mercato', 'competitor', 'piano'
  ];

  if (codingKeywords.some(k => lower.includes(k))) return 'coding';
  if (reasoningKeywords.some(k => lower.includes(k))) return 'reasoning';
  if (businessKeywords.some(k => lower.includes(k))) return 'business';
  return 'general';
}

// ─── UTILITY ──────────────────────────────────────────────────────

export function getModelById(id: OllamaModel): ModelConfig | undefined {
  return MODELS.find(m => m.id === id);
}

export function getRecommendedModel(): OllamaModel {
  return MODELS.find(m => m.recommended)?.id ?? 'llama3.3:70b';
}
