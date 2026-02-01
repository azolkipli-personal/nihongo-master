import { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { AppConfig } from '../../types';
import { loadConfig, saveConfig } from '../../utils/configManager';
import { GEMINI_MODELS, getOllamaModels } from '../../services/llm';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [saved, setSaved] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(loadConfig());
      if (config.selectedService === 'ollama') {
        fetchOllamaModels();
      }
    }
  }, [isOpen]);

  const fetchOllamaModels = async () => {
    const models = await getOllamaModels(config.ollamaUrl);
    setOllamaModels(models);
  };

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleExportSettings = () => {
    try {
      const settingsToExport = { ...config };
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
    }
  };

  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig({ ...config, ...importedConfig });
        alert('Settings imported! Click Save to apply.');
      } catch (error) {
        alert('Failed to import settings.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (!isOpen) return null;

  const colorThemes = [
    { id: 'ocean', color: 'bg-[#00B4FF]' },
    { id: 'emerald', color: 'bg-[#00D98B]' },
    { id: 'purple', color: 'bg-[#A88BFF]' },
    { id: 'pink', color: 'bg-[#FF6B8B]' },
    { id: 'yellow', color: 'bg-[#FFB800]' },
    { id: 'dark-purple', color: 'bg-[#6B5BFF]' },
    { id: 'violet', color: 'bg-[#8B5CF6]' },
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      
      {/* Sidebar - Matching Screenshot Layout */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#1E2538] text-white shadow-2xl z-50 overflow-y-auto font-sans">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold">Settings</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Appearance Section */}
          <section className="mb-8">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Appearance</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => updateConfig({ theme: 'light' })}
                className={`py-2.5 rounded-md text-sm font-medium transition-all ${
                  config.theme === 'light' ? 'bg-[#3E4A6D] text-white' : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
                }`}
              >
                Light Mode
              </button>
              <button
                onClick={() => updateConfig({ theme: 'dark' })}
                className={`py-2.5 rounded-md text-sm font-medium transition-all ${
                  config.theme === 'dark' ? 'bg-[#7C89FF] text-white' : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
                }`}
              >
                Dark Mode
              </button>
            </div>

            <h3 className="text-sm font-medium text-gray-300 mb-4">Color Theme</h3>
            <div className="flex flex-wrap gap-3">
              {colorThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateConfig({ theme: t.id as any })}
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-transform hover:scale-110 relative`}
                >
                  {config.theme === t.id && (
                    <div className="absolute inset-0 rounded-full border-2 border-white flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Language Model Section */}
          <section className="mb-8">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Language Model</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => updateConfig({ selectedService: 'gemini' })}
                className={`py-2.5 rounded-md text-sm font-medium transition-all ${
                  config.selectedService === 'gemini' ? 'bg-[#7C89FF] text-white' : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
                }`}
              >
                Google Gemini
              </button>
              <button
                onClick={() => updateConfig({ selectedService: 'ollama' })}
                className={`py-2.5 rounded-md text-sm font-medium transition-all ${
                  config.selectedService === 'ollama' ? 'bg-[#7C89FF] text-white' : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
                }`}
              >
                Ollama (Local)
              </button>
            </div>

            {/* Dynamic Configuration Container */}
            <div className="bg-[#171C2B] border border-[#2D364D] rounded-lg p-5">
              <h4 className="text-sm font-semibold text-white mb-4">
                {config.selectedService === 'gemini' ? 'Gemini Configuration' : 'Ollama Configuration'}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Select a Model</label>
                  <select
                    value={config.selectedService === 'gemini' ? config.geminiModel : config.ollamaModel}
                    onChange={(e) => updateConfig(
                      config.selectedService === 'gemini' 
                        ? { geminiModel: e.target.value } 
                        : { ollamaModel: e.target.value }
                    )}
                    className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    {config.selectedService === 'gemini' ? (
                      GEMINI_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="">Select a model</option>
                        {ollamaModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {config.selectedService === 'gemini' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">API Key</label>
                    <input
                      type="password"
                      value={config.geminiApiKey}
                      onChange={(e) => updateConfig({ geminiApiKey: e.target.value })}
                      placeholder="Enter Gemini API Key"
                      className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF]"
                    />
                  </div>
                )}

                {config.selectedService === 'ollama' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Ollama URL</label>
                    <input
                      type="text"
                      value={config.ollamaUrl}
                      onChange={(e) => updateConfig({ ollamaUrl: e.target.value })}
                      placeholder="http://localhost:11434"
                      className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF]"
                    />
                    <button 
                      onClick={fetchOllamaModels}
                      className="mt-2 text-xs text-[#7C89FF] hover:underline"
                    >
                      Refresh Models
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="mt-12 space-y-3">
            <button
              onClick={handleSave}
              className={`w-full py-3.5 rounded-md font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                saved ? 'bg-green-500' : 'bg-[#7C89FF] hover:bg-[#6B79F0]'
              }`}
            >
              {saved ? <><Check className="w-5 h-5" /> Saved!</> : 'Save and Close'}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleImportSettings}
                className="py-2.5 bg-[#2A344D] hover:bg-[#35415E] rounded-md text-xs font-medium text-gray-300 transition-all border border-[#3E4A6D]"
              >
                Import Settings
              </button>
              <button
                onClick={handleExportSettings}
                className="py-2.5 bg-[#2A344D] hover:bg-[#35415E] rounded-md text-xs font-medium text-gray-300 transition-all border border-[#3E4A6D]"
              >
                Export Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </>
  );
}
