import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, Check } from 'lucide-react';
import { AppConfig } from '../../types';
import { loadConfig, saveConfig } from '../../utils/configManager';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [showKeys, setShowKeys] = useState({
    wanikani: false,
    gemini: false,
    openrouter: false,
    cohere: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(loadConfig());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const services = [
    { id: 'gemini', name: 'Google Gemini', requiresKey: true },
    { id: 'openrouter', name: 'OpenRouter', requiresKey: true },
    { id: 'cohere', name: 'Cohere', requiresKey: true },
    { id: 'ollama', name: 'Ollama (Local)', requiresKey: false },
  ] as const;

  const themes = [
    { id: 'light', name: 'Light', color: 'bg-gray-100' },
    { id: 'dark', name: 'Dark', color: 'bg-gray-800' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
    { id: 'ocean', name: 'Ocean', color: 'bg-blue-500' },
  ] as const;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* API Keys Section */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">API Keys</h3>
            
            <div className="space-y-4">
              {/* WaniKani */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  WaniKani API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.wanikani ? 'text' : 'password'}
                    value={config.wanikaniApiKey}
                    onChange={(e) => updateConfig({ wanikaniApiKey: e.target.value })}
                    placeholder="Enter your WaniKani API key"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, wanikani: !prev.wanikani }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.wanikani ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Gemini */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={config.geminiApiKey}
                    onChange={(e) => updateConfig({ geminiApiKey: e.target.value })}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.gemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* OpenRouter */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openrouter ? 'text' : 'password'}
                    value={config.openrouterApiKey}
                    onChange={(e) => updateConfig({ openrouterApiKey: e.target.value })}
                    placeholder="Enter your OpenRouter API key"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, openrouter: !prev.openrouter }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.openrouter ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Cohere */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Cohere API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.cohere ? 'text' : 'password'}
                    value={config.cohereApiKey}
                    onChange={(e) => updateConfig({ cohereApiKey: e.target.value })}
                    placeholder="Enter your Cohere API key"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, cohere: !prev.cohere }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.cohere ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Ollama URL */}
              {config.selectedService === 'ollama' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Ollama URL
                  </label>
                  <input
                    type="text"
                    value={config.ollamaUrl}
                    onChange={(e) => updateConfig({ ollamaUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Service Selection */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">AI Service</h3>
            <div className="space-y-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    config.selectedService === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={service.id}
                    checked={config.selectedService === service.id}
                    onChange={(e) => updateConfig({ selectedService: e.target.value as AppConfig['selectedService'] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 flex-1">{service.name}</span>
                  {service.requiresKey && !config[`${service.id}ApiKey` as keyof AppConfig] && (
                    <span className="text-xs text-orange-500">API key needed</span>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Theme Selection */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateConfig({ theme: theme.id as AppConfig['theme'] })}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    config.theme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${theme.color} mr-3`} />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Display Options */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Display Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showFurigana}
                  onChange={(e) => updateConfig({ showFurigana: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-3">Show furigana</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showRomaji}
                  onChange={(e) => updateConfig({ showRomaji: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-3">Show romaji</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showEnglish}
                  onChange={(e) => updateConfig({ showEnglish: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-3">Show English translations</span>
              </label>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
