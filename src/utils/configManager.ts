import { AppConfig } from '../types';

const CONFIG_FILE = '/.nihongo-master/config.json'; // Simplified for browser environment

const DEFAULT_CONFIG: AppConfig = {
  wanikaniApiKey: '',
  geminiApiKey: '',
  openrouterApiKey: '',
  selectedService: 'gemini',
  geminiModel: 'gemini-3-flash-preview',
  ollamaModel: '',
  ollamaUrl: 'http://100.102.113.83:11434',
  appearance: 'dark',
  colorTheme: 'default',
  theme: 'dark',
  showFurigana: true,
  showRomaji: true,
  showEnglish: true,
  userLevel: null,
};

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfigDir(): string {
  return '/.nihongo-master';
}

export function loadConfig(): AppConfig {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nihongo-master-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        const config = { ...DEFAULT_CONFIG, ...parsed };

        // MIGRATION LOGIC: If appearance/colorTheme are missing, derive from old 'theme'
        if (!parsed.appearance || !parsed.colorTheme) {
          if (parsed.theme === 'light') {
            config.appearance = 'light';
            config.colorTheme = 'default';
          } else if (parsed.theme === 'emerald') {
            config.appearance = 'light';
            config.colorTheme = 'emerald';
          } else if (parsed.theme === 'ocean') {
            config.appearance = 'light';
            config.colorTheme = 'ocean';
          } else {
            // Default to dark
            config.appearance = 'dark';
            config.colorTheme = 'default';
          }
          // Save the migrated config immediately
          localStorage.setItem('nihongo-master-config', JSON.stringify(config));
        }

        return config;
      }

      // Check if we have a locally stored API key from file import
      const localGeminiKey = localStorage.getItem('nihongo-master-gemini-key');
      if (localGeminiKey) {
        return { ...DEFAULT_CONFIG, geminiApiKey: localGeminiKey };
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
      // Emit event for theme updates
      window.dispatchEvent(new CustomEvent('configUpdated'));
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
  };
}

export function hasApiKey(config: AppConfig, service: string): boolean {
  switch (service) {
    case 'gemini':
      return !!config.geminiApiKey;
    case 'openrouter':
      return !!config.openrouterApiKey;
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
    case 'ollama':
      return 'ollama';
    default:
      return null;
  }
}

export async function importApiKeyFromFile(file: File): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const text = await file.text();

    // Try to parse as JSON first (for our config/gemini-key.json format)
    try {
      const jsonData = JSON.parse(text);
      if (jsonData.gemini_api_key) {
        localStorage.setItem('nihongo-master-gemini-key', jsonData.gemini_api_key);
        return { success: true, key: jsonData.gemini_api_key };
      }
    } catch {
      // Not JSON, try to extract as plain text
      const keyMatch = text.match(/AIzaSy[\w-]{35}/);
      if (keyMatch) {
        localStorage.setItem('nihongo-master-gemini-key', keyMatch[0]);
        return { success: true, key: keyMatch[0] };
      }
    }

    return { success: false, error: 'No valid Gemini API key found in file' };
  } catch (error) {
    return { success: false, error: 'Failed to read file: ' + (error as Error).message };
  }
}

export function getStoredGeminiKey(): string | null {
  return localStorage.getItem('nihongo-master-gemini-key');
}

export function storeGeminiKey(key: string): void {
  localStorage.setItem('nihongo-master-gemini-key', key);
}
