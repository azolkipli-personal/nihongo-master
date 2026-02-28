import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    loadConfig,
    saveConfig,
    updateConfig,
    hasApiKey,
    getActiveApiKey,
    sanitizeConfig,
} from '../configManager';
import { AppConfig } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'dispatchEvent', { value: vi.fn() });

describe('configManager utilities', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('loadConfig', () => {
        it('returns default config when no stored config exists', () => {
            const config = loadConfig();
            expect(config.selectedService).toBe('gemini');
            expect(config.showFurigana).toBe(true);
            expect(config.showRomaji).toBe(true);
            expect(config.showEnglish).toBe(true);
        });

        it('loads stored config from localStorage', () => {
            const storedConfig = { theme: 'dark', selectedService: 'ollama' };
            localStorageMock.setItem('nihongo-master-config', JSON.stringify(storedConfig));

            const config = loadConfig();
            expect(config.theme).toBe('dark');
            expect(config.selectedService).toBe('ollama');
        });

        it('merges stored config with defaults', () => {
            const storedConfig = { theme: 'ocean' };
            localStorageMock.setItem('nihongo-master-config', JSON.stringify(storedConfig));

            const config = loadConfig();
            expect(config.theme).toBe('ocean');
            expect(config.selectedService).toBe('gemini'); // default value
        });
    });

    describe('saveConfig', () => {
        it('saves config to localStorage', () => {
            const config: AppConfig = {
                wanikaniApiKey: '',
                geminiApiKey: 'test-key',
                openrouterApiKey: '',
                selectedService: 'gemini',
                geminiModel: 'gemini-3-flash-preview',
                ollamaModel: '',
                ollamaUrl: 'http://localhost:11434',
                theme: 'dark',
                showFurigana: true,
                showRomaji: true,
                showEnglish: true,
                userLevel: null,
                appearance: 'dark',
                colorTheme: 'default',
            };

            saveConfig(config);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'nihongo-master-config',
                JSON.stringify(config)
            );
        });
    });

    describe('updateConfig', () => {
        it('updates and returns the merged config', () => {
            const updated = updateConfig({ theme: 'emerald' });
            expect(updated.theme).toBe('emerald');
        });
    });

    describe('hasApiKey', () => {
        const config: AppConfig = {
            wanikaniApiKey: '',
            geminiApiKey: 'gemini-key',
            openrouterApiKey: 'openrouter-key',
            selectedService: 'gemini',
            geminiModel: 'gemini-3-flash-preview',
            ollamaModel: '',
            ollamaUrl: 'http://localhost:11434',
            theme: 'dark',
            showFurigana: true,
            showRomaji: true,
            showEnglish: true,
            userLevel: null,
            appearance: 'dark',
            colorTheme: 'default',
        };

        it('returns true for gemini when key exists', () => {
            expect(hasApiKey(config, 'gemini')).toBe(true);
        });

        it('returns true for openrouter when key exists', () => {
            expect(hasApiKey(config, 'openrouter')).toBe(true);
        });

        it('returns true for ollama (no key required)', () => {
            expect(hasApiKey(config, 'ollama')).toBe(true);
        });

        it('returns false for unknown service', () => {
            expect(hasApiKey(config, 'unknown')).toBe(false);
        });
    });

    describe('getActiveApiKey', () => {
        it('returns gemini key when gemini is selected', () => {
            const config: AppConfig = {
                wanikaniApiKey: '',
                geminiApiKey: 'my-gemini-key',
                openrouterApiKey: '',
                selectedService: 'gemini',
                geminiModel: 'gemini-3-flash-preview',
                ollamaModel: '',
                ollamaUrl: 'http://localhost:11434',
                theme: 'dark',
                showFurigana: true,
                showRomaji: true,
                showEnglish: true,
                userLevel: null,
                appearance: 'dark',
                colorTheme: 'default',
            };
            expect(getActiveApiKey(config)).toBe('my-gemini-key');
        });

        it('returns "ollama" when ollama is selected', () => {
            const config: AppConfig = {
                wanikaniApiKey: '',
                geminiApiKey: '',
                openrouterApiKey: '',
                selectedService: 'ollama',
                geminiModel: 'gemini-3-flash-preview',
                ollamaModel: '',
                ollamaUrl: 'http://localhost:11434',
                theme: 'dark',
                showFurigana: true,
                showRomaji: true,
                showEnglish: true,
                userLevel: null,
                appearance: 'dark',
                colorTheme: 'default',
            };
            expect(getActiveApiKey(config)).toBe('ollama');
        });

        it('returns null when no key is set for selected service', () => {
            const config: AppConfig = {
                wanikaniApiKey: '',
                geminiApiKey: '',
                openrouterApiKey: '',
                selectedService: 'gemini',
                geminiModel: 'gemini-3-flash-preview',
                ollamaModel: '',
                ollamaUrl: 'http://localhost:11434',
                theme: 'dark',
                showFurigana: true,
                showRomaji: true,
                showEnglish: true,
                userLevel: null,
                appearance: 'dark',
                colorTheme: 'default',
            };
            expect(getActiveApiKey(config)).toBe(null);
        });
    });

    describe('sanitizeConfig', () => {
        it('masks API keys in output', () => {
            const config: AppConfig = {
                wanikaniApiKey: 'secret-wanikani',
                geminiApiKey: 'secret-gemini',
                openrouterApiKey: 'secret-openrouter',
                selectedService: 'gemini',
                geminiModel: 'gemini-3-flash-preview',
                ollamaModel: '',
                ollamaUrl: 'http://localhost:11434',
                theme: 'dark',
                showFurigana: true,
                showRomaji: true,
                showEnglish: true,
                userLevel: null,
                appearance: 'dark',
                colorTheme: 'default',
            };

            const sanitized = sanitizeConfig(config);
            expect(sanitized.wanikaniApiKey).toBe('***');
            expect(sanitized.geminiApiKey).toBe('***');
            expect(sanitized.openrouterApiKey).toBe('***');
            expect(sanitized.theme).toBe('dark');
        });

        it('shows empty string for missing API keys', () => {
            const config: AppConfig = {
                wanikaniApiKey: '',
                geminiApiKey: '',
                openrouterApiKey: '',
                selectedService: 'gemini',
                geminiModel: 'gemini-3-flash-preview',
                ollamaModel: '',
                ollamaUrl: 'http://localhost:11434',
                theme: 'light',
                showFurigana: true,
                showRomaji: true,
                showEnglish: true,
                userLevel: null,
                appearance: 'dark',
                colorTheme: 'default',
            };

            const sanitized = sanitizeConfig(config);
            expect(sanitized.wanikaniApiKey).toBe('');
            expect(sanitized.geminiApiKey).toBe('');
            expect(sanitized.openrouterApiKey).toBe('');
        });
    });
});
