import React, { useRef } from 'react';
import { useKaiwaState } from './useKaiwaState';
import { KaiwaInputSection } from './KaiwaInputSection';
import { KaiwaResults } from './KaiwaResults';
import { loadConfig } from '../../utils/configManager';

export function KaiwaTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKeyFileInputRef = useRef<HTMLInputElement>(null);

  const {
    words,
    scenario,
    conversations,
    loading,
    error,
    showFurigana,
    showRomaji,
    showEnglish,
    selectedModel,
    modelDropdownOpen,
    ollamaModels,
    currentService,
    refreshingModels,
    exportDropdownOpen,
    setWords,
    setScenario,
    setShowFurigana,
    setShowRomaji,
    setShowEnglish,
    setSelectedModel,
    setModelDropdownOpen,
    setExportDropdownOpen,
    handleGenerate,
    handleDelete,
    handleExport,
    handleImportConversations,
    handleImportApiKey,
    handleModelDropdownToggle,
    fetchOllamaModels,
  } = useKaiwaState();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let importedData = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedData)) {
          if (importedData.conversations && Array.isArray(importedData.conversations)) {
            importedData = importedData.conversations;
          } else {
            alert('Invalid file format.');
            return;
          }
        }
        const count = handleImportConversations(importedData);
        if (count > 0) {
          alert(`Successfully imported ${count} conversations!`);
        } else {
          alert('No valid conversations found.');
        }
      } catch (error) {
        alert('Failed to import conversations.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleApiKeyFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await handleImportApiKey(file);
    if (result.success) {
      alert('Successfully imported Gemini API key!');
    } else {
      alert(`Failed to import API key: ${result.error}`);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <KaiwaInputSection
        words={words}
        scenario={scenario}
        loading={loading}
        error={error}
        currentService={currentService}
        selectedModel={selectedModel}
        ollamaModels={ollamaModels}
        modelDropdownOpen={modelDropdownOpen}
        refreshingModels={refreshingModels}
        onWordsChange={setWords}
        onScenarioChange={setScenario}
        onModelDropdownToggle={handleModelDropdownToggle}
        onModelSelect={(model) => {
          setSelectedModel(model);
          setModelDropdownOpen(false);
        }}
        onRefreshOllamaModels={() => {
          const cfg = loadConfig();
          fetchOllamaModels(cfg.ollamaUrl);
        }}
        onGenerate={handleGenerate}
        onImportConversations={() => fileInputRef.current?.click()}
        onImportApiKey={() => apiKeyFileInputRef.current?.click()}
      />

      <KaiwaResults
        conversations={conversations}
        showFurigana={showFurigana}
        showRomaji={showRomaji}
        showEnglish={showEnglish}
        exportDropdownOpen={exportDropdownOpen}
        onToggleFurigana={() => setShowFurigana(!showFurigana)}
        onToggleRomaji={() => setShowRomaji(!showRomaji)}
        onToggleEnglish={() => setShowEnglish(!showEnglish)}
        onExportDropdownToggle={() => setExportDropdownOpen(!exportDropdownOpen)}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      <input
        ref={apiKeyFileInputRef}
        type="file"
        accept=".json,.txt,.env"
        onChange={handleApiKeyFileImport}
        className="hidden"
      />
    </div>
  );
}
