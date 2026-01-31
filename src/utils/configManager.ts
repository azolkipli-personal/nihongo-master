import { AppConfig } from '../types';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.nihongo-master');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: AppConfig = {
  wanikaniApiKey: '',
  geminiApiKey: '',
  openrouterApiKey: '',
  cohereApiKey: '',
  selectedService: 'gemini',
  ollamaUrl: 'http://localhost:11434',
  theme: 'light',
  showFurigana: true,
  showRomaji: true,
  showEnglish: true,
  userLevel: null,
};

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function loadConfig(): AppConfig {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nihongo-master-config');
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nihongo-master-config', JSON.stringify(config));
    }
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const current = loadConfig();
  const updated = { ...current, ...updates };
  saveConfig(updated);
  return updated;
}

export function sanitizeConfig(config: AppConfig): Record<string, unknown> {
  return {
    ...config,
    wanikaniApiKey: config.wanikaniApiKey ? '***' : '',
    geminiApiKey: config.geminiApiKey ? '***' : '',
    openrouterApiKey: config.openrouterApiKey ? '***' : '',
    cohereApiKey: config.cohereApiKey ? '***' : '',
  };
}

export function hasApiKey(config: AppConfig, service: string): boolean {
  switch (service) {
    case 'gemini':
      return !!config.geminiApiKey;
    case 'openrouter':
      return !!config.openrouterApiKey;
    case 'cohere':
      return !!config.cohereApiKey;
    case 'ollama':
      return true;
    default:
      return false;
  }
}

export function getActiveApiKey(config: AppConfig): string | null {
  switch (config.selectedService) {
    case 'gemini':
      return config.geminiApiKey || null;
    case 'openrouter':
      return config.openrouterApiKey || null;
    case 'cohere':
      return config.cohereApiKey || null;
    case 'ollama':
      return 'ollama';
    default:
      return null;
  }
}
