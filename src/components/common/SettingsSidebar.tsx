import { useRef } from 'react';
import { X } from 'lucide-react';
import { AppearanceSection } from './AppearanceSection';
import { LLMConfigSection } from './LLMConfigSection';
import { IntegrationsSection } from './IntegrationsSection';
import { SyncSection } from './SyncSection';
import { SettingsActionButtons } from './SettingsActionButtons';
import { useSettingsState } from './useSettingsState';
import type { AppConfig } from '../../types';

type ColorTheme = AppConfig['colorTheme'];

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onPushSync?: () => void;
  onPullSync?: () => void;
  onForcePushSync?: () => void;
}

export function SettingsSidebar({
  isOpen,
  onClose,
  onPushSync,
  onPullSync,
  onForcePushSync,
}: SettingsSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config, saved, updateConfig, handleSave, handleExportSettings, handleImportSettings } =
    useSettingsState(isOpen, onClose);

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
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <AppearanceSection
            appearance={config.appearance}
            colorTheme={config.colorTheme}
            onAppearanceChange={(app) => updateConfig({ appearance: app })}
            onColorThemeChange={(theme) => updateConfig({ colorTheme: theme as ColorTheme })}
          />

          <LLMConfigSection
            selectedService={config.selectedService}
            geminiModel={config.geminiModel}
            openrouterModel={config.openrouterModel || ''}
            geminiApiKey={config.geminiApiKey}
            openrouterApiKey={config.openrouterApiKey}
            onServiceChange={(service) => updateConfig({ selectedService: service })}
            onModelChange={(model) =>
              updateConfig(
                config.selectedService === 'gemini'
                  ? { geminiModel: model }
                  : { openrouterModel: model }
              )
            }
            onApiKeyChange={(key) =>
              updateConfig(
                config.selectedService === 'gemini'
                  ? { geminiApiKey: key }
                  : { openrouterApiKey: key }
              )
            }
          />

          <IntegrationsSection
            wanikaniApiKey={config.wanikaniApiKey}
            onWaniKaniApiKeyChange={(key) => updateConfig({ wanikaniApiKey: key })}
          />

          <SyncSection
            syncBackend={config.syncBackend}
            syncNucUrl={config.syncNucUrl}
            onSyncBackendChange={(backend) => updateConfig({ syncBackend: backend })}
            onSyncNucUrlChange={(url) => updateConfig({ syncNucUrl: url })}
            onPushSync={onPushSync}
            onPullSync={onPullSync}
            onForcePushSync={onForcePushSync}
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
