import React, { useRef } from 'react';
import { useKaiwaState } from './useKaiwaState';
import { KaiwaInputSection } from './KaiwaInputSection';
import { KaiwaResults } from './KaiwaResults';

export function KaiwaTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    words,
    scenario,
    conversations,
    loading,
    error,
    showFurigana,
    showRomaji,
    showEnglish,
    exportDropdownOpen,
    cefrLevel,
    setWords,
    setScenario,
    setShowFurigana,
    setShowRomaji,
    setShowEnglish,
    setExportDropdownOpen,
    setCefrLevel,
    handleGenerate,
    handleDelete,
    handleExport,
    handleImportConversations,
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

  return (
    <div className="space-y-6">
      <KaiwaInputSection
        words={words}
        scenario={scenario}
        cefrLevel={cefrLevel}
        loading={loading}
        error={error}
        onWordsChange={setWords}
        onScenarioChange={setScenario}
        onCefrLevelChange={setCefrLevel}
        onGenerate={handleGenerate}
        onImportConversations={() => fileInputRef.current?.click()}
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
    </div>
  );
}

