import { useState, useEffect, useCallback } from 'react';
import { AppConfig } from '../../types';
import { loadConfig, saveConfig } from '../../utils/configManager';
import { getOllamaModels } from '../../services/llm';

export function useSettingsState(isOpen: boolean, onClose: () => void) {
    const [config, setConfig] = useState<AppConfig>(loadConfig());
    const [saved, setSaved] = useState(false);
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);

    const fetchOllamaModels = useCallback(async (url?: string) => {
        try {
            const models = await getOllamaModels(url || config.ollamaUrl);
            setOllamaModels(models);
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
        }
    }, [config.ollamaUrl]);

    useEffect(() => {
        if (isOpen) {
            const currentConfig = loadConfig();
            setConfig(currentConfig);
            if (currentConfig.selectedService === 'ollama') {
                fetchOllamaModels(currentConfig.ollamaUrl);
            }
        }
    }, [isOpen, fetchOllamaModels]);

    const handleSave = useCallback(() => {
        saveConfig(config);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1500);
    }, [config, onClose]);

    const updateConfig = useCallback((updates: Partial<AppConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    const handleExportSettings = useCallback(() => {
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
            alert('Failed to export settings.');
        }
    }, [config]);

    const handleImportSettings = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedConfig = JSON.parse(e.target?.result as string);
                setConfig(prev => ({ ...prev, ...importedConfig }));
                alert('Settings imported! Click Save to apply.');
            } catch (error) {
                alert('Failed to import settings.');
            }
        };
        reader.readAsText(file);
    }, []);

    return {
        config,
        saved,
        ollamaModels,
        updateConfig,
        handleSave,
        handleExportSettings,
        handleImportSettings,
        fetchOllamaModels,
    };
}
