import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Save, Check, Upload, Download, Key } from 'lucide-react';
import { AppConfig } from '../../types';
import { loadConfig, saveConfig, importApiKeyFromFile } from '../../utils/configManager';
import { useThemeContext } from '../../utils/ThemeContext';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const { themeClasses } = useThemeContext();
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [showKeys, setShowKeys] = useState({
    wanikani: false,
    gemini: false,
    openrouter: false,
    cohere: false,
  });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKeyFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportSettings = () => {
    try {
      const settingsToExport = {
        ...config,
        // Sanitize API keys for export
        wanikaniApiKey: config.wanikaniApiKey ? '***CONFIGURED***' : '',
        geminiApiKey: config.geminiApiKey ? '***CONFIGURED***' : '',
        openrouterApiKey: config.openrouterApiKey ? '***CONFIGURED***' : '',
        cohereApiKey: config.cohereApiKey ? '***CONFIGURED***' : '',
      };
      
      // Generate timestamp in YYYYMMDDHHMM format
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0') +
                       now.getHours().toString().padStart(2, '0') +
                       now.getMinutes().toString().padStart(2, '0');
      
      const dataStr = JSON.stringify(settingsToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${timestamp}-nihongo-master-settings.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
      alert('Failed to export settings. Please try again.');
    }
  };

  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  const handleImportApiKey = () => {
    apiKeyFileInputRef.current?.click();
  };

  const handleApiKeyFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importApiKeyFromFile(file);
    if (result.success) {
      alert(`Successfully imported Gemini API key!`);
      // Update the config with the new key
      updateConfig({ geminiApiKey: result.key! });
      saveConfig({ ...config, geminiApiKey: result.key! });
    } else {
      alert(`Failed to import API key: ${result.error}`);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        
        // Validate the imported config
        const requiredFields = ['selectedService', 'theme', 'showFurigana', 'showRomaji', 'showEnglish'];
        const hasRequiredFields = requiredFields.every(field => field in importedConfig);
        
        if (!hasRequiredFields) {
          alert('Invalid settings file. Please select a valid Nihongo Master settings file.');
          return;
        }

        // Preserve existing API keys if the imported ones are masked
        const finalConfig = { ...importedConfig };
        if (importedConfig.wanikaniApiKey === '***CONFIGURED***') {
          finalConfig.wanikaniApiKey = config.wanikaniApiKey;
        }
        if (importedConfig.geminiApiKey === '***CONFIGURED***') {
          finalConfig.geminiApiKey = config.geminiApiKey;
        }
        if (importedConfig.openrouterApiKey === '***CONFIGURED***') {
          finalConfig.openrouterApiKey = config.openrouterApiKey;
        }
        if (importedConfig.cohereApiKey === '***CONFIGURED***') {
          finalConfig.cohereApiKey = config.cohereApiKey;
        }

        setConfig(finalConfig);
        alert('Settings imported successfully! Click "Save Settings" to apply the changes.');
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
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
      <div className={`fixed right-0 top-0 h-full w-full max-w-md ${themeClasses.sidebar} shadow-2xl z-50 overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Settings</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
            >
              <X className={`w-6 h-6 ${themeClasses.textSecondary}`} />
            </button>
          </div>

          {/* API Keys Section */}
          <section className="mb-8">
            <h3 className={`text-lg font-semibold ${themeClasses.textSecondary} mb-4`}>API Keys</h3>
            
            <div className="space-y-4">
              {/* WaniKani */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
                  WaniKani API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.wanikani ? 'text' : 'password'}
                    value={config.wanikaniApiKey}
                    onChange={(e) => updateConfig({ wanikaniApiKey: e.target.value })}
                    placeholder="Enter your WaniKani API key"
                    className={`w-full px-4 py-2 pr-10 border ${themeClasses.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={config.geminiApiKey}
                    onChange={(e) => updateConfig({ geminiApiKey: e.target.value })}
                    placeholder="Enter your Gemini API key"
                    className={`w-full px-4 py-2 pr-10 border ${themeClasses.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.gemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    onClick={handleImportApiKey}
                    className={`flex items-center gap-2 px-3 py-1 text-xs ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                  >
                    <Key className="w-3 h-3" />
                    Import from File
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
            <h3 className={`text-lg font-semibold ${themeClasses.textSecondary} mb-4`}>AI Service</h3>
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
            <h3 className={`text-lg font-semibold ${themeClasses.textSecondary} mb-4`}>Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateConfig({ theme: theme.id as AppConfig['theme'] })}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    config.theme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : `${themeClasses.border} ${themeClasses.hover}`
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
            <h3 className={`text-lg font-semibold ${themeClasses.textSecondary} mb-4`}>Display Options</h3>
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

          {/* Import/Export Settings */}
          <section className="mb-6">
            <h3 className={`text-lg font-semibold ${themeClasses.textSecondary} mb-4`}>Settings Management</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportSettings}
                className={`flex items-center justify-center gap-2 p-3 border ${themeClasses.border} rounded-lg ${themeClasses.hover} transition-colors`}
              >
                <Download className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                <span>Export Settings</span>
              </button>
              <button
                onClick={handleImportSettings}
                className={`flex items-center justify-center gap-2 p-3 border ${themeClasses.border} rounded-lg ${themeClasses.hover} transition-colors`}
              >
                <Upload className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                <span>Import Settings</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : `${themeClasses.button} ${themeClasses.buttonText}`
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
      
      {/* Hidden file input for importing conversations */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      
      {/* Hidden file input for importing API keys */}
      <input
        ref={apiKeyFileInputRef}
        type="file"
        accept=".json,.txt,.env"
        onChange={handleApiKeyFileImport}
        className="hidden"
      />
    </>
  );
}
