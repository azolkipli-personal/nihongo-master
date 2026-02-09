import { useRef } from 'react';
import { X } from 'lucide-react';
import { AppearanceSection } from './AppearanceSection';
import { LLMConfigSection } from './LLMConfigSection';
import { IntegrationsSection } from './IntegrationsSection';
import { SettingsActionButtons } from './SettingsActionButtons';
import { useSettingsState } from './useSettingsState';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    config,
    saved,
    ollamaModels,
    updateConfig,
    handleSave,
    handleExportSettings,
    handleImportSettings,
    fetchOllamaModels,
  } = useSettingsState(isOpen, onClose);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportSettings(file);
    }
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
            onRefreshOllamaModels={() => fetchOllamaModels()}
          />

          <IntegrationsSection
            wanikaniApiKey={config.wanikaniApiKey}
            onWaniKaniApiKeyChange={(key) => updateConfig({ wanikaniApiKey: key })}
          />

          <SettingsActionButtons
            saved={saved}
            onSave={handleSave}
            onImport={() => fileInputRef.current?.click()}
            onExport={handleExportSettings}
          />
        </div>
      </div>


      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onFileChange}
        className="hidden"
      />
    </>
  );
}

