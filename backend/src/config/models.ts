// ════════════════════════════════════════════════════════════════════════════
// AI ARENA - MODEL CONFIGURATION
// 3 Tiers: Basic (free), Standard (request), Premium (admin approval)
// ════════════════════════════════════════════════════════════════════════════

export type ModelTier = 'basic' | 'standard' | 'premium';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  description: string;
  contextWindow: number;
  inputCost: number;  // per 1M tokens in USD
  outputCost: number; // per 1M tokens in USD
  strengths: string[];
  icon?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// BASIC TIER - Free for all users
// Best value: günstig und gut
// ════════════════════════════════════════════════════════════════════════════

export const BASIC_MODELS: ModelConfig[] = [
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    provider: 'Google',
    tier: 'basic',
    description: 'Extrem schnell und günstig, ideal für einfache Aufgaben',
    contextWindow: 1000000,
    inputCost: 0.075,
    outputCost: 0.30,
    strengths: ['Sehr schnell', 'Günstig', 'Großes Kontextfenster'],
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    tier: 'basic',
    description: 'Open Source, schnell und effizient',
    contextWindow: 131072,
    inputCost: 0.055,
    outputCost: 0.055,
    strengths: ['Open Source', 'Schnell', 'Kosteneffizient'],
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    provider: 'Mistral AI',
    tier: 'basic',
    description: 'Kompaktes aber leistungsstarkes Modell',
    contextWindow: 32768,
    inputCost: 0.055,
    outputCost: 0.055,
    strengths: ['Kompakt', 'Schnell', 'Gute Qualität'],
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    tier: 'basic',
    description: 'Schnellstes Claude Modell, ideal für Chat',
    contextWindow: 200000,
    inputCost: 0.25,
    outputCost: 1.25,
    strengths: ['Sehr schnell', 'Sicher', 'Gutes Reasoning'],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// STANDARD TIER - Request required (auto-approval or quick review)
// Better quality, moderate price
// ════════════════════════════════════════════════════════════════════════════

export const STANDARD_MODELS: ModelConfig[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    tier: 'standard',
    description: 'Kompakte Version von GPT-4o, sehr gutes Preis-Leistungs-Verhältnis',
    contextWindow: 128000,
    inputCost: 0.15,
    outputCost: 0.60,
    strengths: ['Schnell', 'Günstig', 'Multimodal'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tier: 'standard',
    description: 'Beste Balance zwischen Qualität und Kosten',
    contextWindow: 200000,
    inputCost: 3.00,
    outputCost: 15.00,
    strengths: ['Exzellente Qualität', 'Coding', 'Analyse'],
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    tier: 'standard',
    description: 'Leistungsstark mit riesigem Kontextfenster',
    contextWindow: 2000000,
    inputCost: 1.25,
    outputCost: 5.00,
    strengths: ['Riesiges Kontextfenster', 'Multimodal', 'Analyse'],
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    tier: 'standard',
    description: 'Großes Open Source Modell mit starker Leistung',
    contextWindow: 131072,
    inputCost: 0.35,
    outputCost: 0.40,
    strengths: ['Open Source', 'Starke Leistung', 'Coding'],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// PREMIUM TIER - Admin approval required (1, 3, or 7 days)
// Best quality, highest price
// ════════════════════════════════════════════════════════════════════════════

export const PREMIUM_MODELS: ModelConfig[] = [
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'Leistungsstärkstes GPT-4 Modell',
    contextWindow: 128000,
    inputCost: 10.00,
    outputCost: 30.00,
    strengths: ['Top Qualität', 'Multimodal', 'Coding'],
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    tier: 'premium',
    description: 'Bestes Claude Modell für komplexe Aufgaben',
    contextWindow: 200000,
    inputCost: 15.00,
    outputCost: 75.00,
    strengths: ['Höchste Qualität', 'Komplexe Analysen', 'Kreativität'],
  },
  {
    id: 'openai/o1-preview',
    name: 'O1 Preview',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'Neues Reasoning-Modell mit Chain-of-Thought',
    contextWindow: 128000,
    inputCost: 15.00,
    outputCost: 60.00,
    strengths: ['Advanced Reasoning', 'Mathematik', 'Wissenschaft'],
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'Neuestes OpenAI Flaggschiff-Modell',
    contextWindow: 128000,
    inputCost: 2.50,
    outputCost: 10.00,
    strengths: ['Schnell', 'Multimodal', 'Exzellente Qualität'],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// COMBINED CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const ALL_MODELS: ModelConfig[] = [
  ...BASIC_MODELS,
  ...STANDARD_MODELS,
  ...PREMIUM_MODELS,
];

export const MODELS_BY_TIER = {
  basic: BASIC_MODELS,
  standard: STANDARD_MODELS,
  premium: PREMIUM_MODELS,
};

export const getModelById = (id: string): ModelConfig | undefined => {
  return ALL_MODELS.find(m => m.id === id);
};

export const getModelsByTier = (tier: ModelTier): ModelConfig[] => {
  return MODELS_BY_TIER[tier];
};

// Access duration options for premium models (in days)
export const PREMIUM_ACCESS_DURATIONS = [1, 3, 7] as const;
export type PremiumAccessDuration = typeof PREMIUM_ACCESS_DURATIONS[number];

export default {
  ALL_MODELS,
  BASIC_MODELS,
  STANDARD_MODELS,
  PREMIUM_MODELS,
  MODELS_BY_TIER,
  getModelById,
  getModelsByTier,
  PREMIUM_ACCESS_DURATIONS,
};
