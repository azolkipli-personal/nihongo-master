import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AppConfig } from '../../types';
import { loadConfig, saveConfig } from '../../utils/configManager';
import { getOllamaModels } from '../../services/llm';
import { AppearanceSection } from './AppearanceSection';
import { LLMConfigSection } from './LLMConfigSection';
import { SettingsActionButtons } from './SettingsActionButtons';

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
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0');

      const dataStr = JSON.stringify(config, null, 2);
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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#1E2538] text-white shadow-2xl z-50 overflow-y-auto font-sans">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold">Settings</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <AppearanceSection
            theme={config.theme}
            onThemeChange={(theme) => updateConfig({ theme: theme as any })}
          />

          <LLMConfigSection
            selectedService={config.selectedService}
            geminiModel={config.geminiModel}
            ollamaModel={config.ollamaModel}
            geminiApiKey={config.geminiApiKey}
            ollamaUrl={config.ollamaUrl}
            ollamaModels={ollamaModels}
            onServiceChange={(service) => updateConfig({ selectedService: service })}
            onModelChange={(model) => updateConfig(
              config.selectedService === 'gemini'
                ? { geminiModel: model }
                : { ollamaModel: model }
            )}
            onApiKeyChange={(key) => updateConfig({ geminiApiKey: key })}
            onOllamaUrlChange={(url) => updateConfig({ ollamaUrl: url })}
            onRefreshOllamaModels={fetchOllamaModels}
          />

          <SettingsActionButtons
            saved={saved}
            onSave={handleSave}
            onImport={handleImportSettings}
            onExport={handleExportSettings}
          />
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
