import React, { useState, useEffect } from 'react';
import { Send, Download, Trash2, Loader2, ChevronDown, Upload, FileText, Key } from 'lucide-react';
import { generateConversation, FREE_GEMINI_MODELS, loadPuterJS } from '../../services/llm';
import { loadConfig, saveConfig, importApiKeyFromFile } from '../../utils/configManager';
import { saveSession } from '../../utils/sessionStorage';
import { Conversation } from '../../types';
import { Furigana } from '../common/Furigana';
import { ToggleButton } from '../common/ToggleButton';

export function KaiwaTab() {
  const [words, setWords] = useState('');
  const [scenario, setScenario] = useState('work conversations in an IT engineering company');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [fileInputRef] = useState<React.RefObject<HTMLInputElement>>(() => React.createRef());
  const [apiKeyFileInputRef] = useState<React.RefObject<HTMLInputElement>>(() => React.createRef());

  useEffect(() => {
    // Load Puter.js script when component mounts
    loadPuterJS().catch(console.error);

    // Check for pending practice word from Tango tab
    const practiceWord = sessionStorage.getItem('kaiwa_practice_word');
    if (practiceWord) {
      setWords(practiceWord);
      sessionStorage.removeItem('kaiwa_practice_word');
    }
  }, []);

  const handleGenerate = async () => {
    const config = loadConfig();
    const apiKey = config.selectedService === 'gemini' ? config.geminiApiKey :
                   config.selectedService === 'openrouter' ? config.openrouterApiKey :
                   config.selectedService === 'cohere' ? config.cohereApiKey : 'ollama';

    if (!apiKey && config.selectedService !== 'ollama') {
      setError(`Please set your ${config.selectedService} API key in settings`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const wordList = words.split(',').map(w => w.trim()).filter(Boolean);
      
      if (wordList.length === 0) {
        setError('Please enter at least one vocabulary word');
        return;
      }

      console.log('Generating conversation for words:', wordList);
      const result = await generateConversation(wordList, scenario, config.selectedService, apiKey, config.ollamaUrl, selectedModel);
      
      console.log('Received result:', result);
      
      // Handle the new response format with word details and meanings
      const newConversations: Conversation[] = result.conversations.map((conv, idx) => ({
        id: Date.now().toString() + idx,
        title: conv.title || `${wordList[0]} - Business Context`,
        words: wordList,
        scenario: scenario || 'IT engineering work conversation',
        service: config.selectedService,
        createdAt: new Date(),
        dialogue: conv.dialogue || [],
        // Store word details and meaning if available
        wordDetails: (conv as any).wordDetails,
        meaning: (conv as any).meaning || `${wordList.join(', ')} in IT engineering context - Professional business terminology and usage patterns in software development environments.`,
      }));

      // Validate the response
      if (!newConversations || newConversations.length === 0) {
        throw new Error('No conversations generated');
      }

      // Check if we have proper word explanations
      newConversations.forEach(conv => {
        if (!(conv as any).meaning || !(conv as any).wordDetails) {
          console.warn('Missing word explanation for conversation:', conv.title);
          (conv as any).meaning = (conv as any).meaning || `${wordList.join(', ')} - Professional IT terminology and business usage in engineering contexts.`;
          (conv as any).wordDetails = (conv as any).wordDetails || {
            kanji: wordList[0] || '',
            kana: '',
            romaji: ''
          };
        }
      });

      setConversations(prev => [...newConversations, ...prev]);
      
      // Save session
      saveSession({
        id: Date.now().toString(),
        date: new Date(),
        type: 'kaiwa',
        duration: 5,
        itemsStudied: wordList.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const handleExportConversations = (format: 'json' | 'csv' | 'anki' = 'json') => {
    if (conversations.length === 0) {
      alert('No conversations to export');
      return;
    }

    try {
      // Generate timestamp in YYYYMMDDHHMM format
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0') +
                       now.getHours().toString().padStart(2, '0') +
                       now.getMinutes().toString().padStart(2, '0');

      if (format === 'json') {
        // Match the reference format from kaiwa-renshuu
        const exportData = conversations.map(conv => {
          // Extract the main word from the conversation if available
          const mainWord = conv.words?.[0] || 'conversation';
          const wordDetails = {
            kanji: mainWord,
            kana: conv.dialogue?.[0]?.japanese?.match(/\[([^\]]+)\]/)?.[1] || '',
            romaji: conv.dialogue?.[0]?.romaji || ''
          };

          return {
            wordDetails,
            meaning: `${mainWord} in the context of ${conv.scenario || 'IT engineering company'} refers to relevant business terminology and usage patterns.`,
            conversations: [{
              title: conv.title || 'Business Conversation',
              dialogue: conv.dialogue.map(d => ({
                speaker: d.speaker,
                japanese: d.japaneseWithFurigana || d.japanese,
                romaji: d.romaji,
                english: d.english
              }))
            }]
          };
        });

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${timestamp}-nihongo-conversations.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // CSV format matching reference structure - one row per word/conversation
        let csv = 'Word,Meaning,Conversation Title,Speaker,Japanese,Romaji,English\n';
        conversations.forEach(conv => {
          const mainWord = conv.words?.[0] || 'conversation';
          const meaning = `${mainWord} in ${conv.scenario || 'IT engineering context'}`;
          
          conv.dialogue.forEach(d => {
            csv += `"${mainWord}","${meaning}","${conv.title}","${d.speaker}","${d.japaneseWithFurigana || d.japanese}","${d.romaji}","${d.english}"\n`;
          });
        });
        
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `${timestamp}-nihongo-conversations.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
      } else if (format === 'anki') {
        // Anki-compatible TSV format matching reference structure
        let tsv = 'Japanese\tJapanese with Furigana\tRomaji\tEnglish\tSpeaker\tWord\tMeaning\tConversation Title\n';
        conversations.forEach(conv => {
          const mainWord = conv.words?.[0] || 'conversation';
          const meaning = `${mainWord} in ${conv.scenario || 'IT engineering context'}`;
          
          conv.dialogue.forEach(d => {
            tsv += `${d.japanese}\t${d.japaneseWithFurigana || d.japanese}\t${d.romaji}\t${d.english}\t${d.speaker}\t${mainWord}\t${meaning}\t${conv.title}\n`;
          });
        });
        
        const tsvBlob = new Blob([tsv], { type: 'text/tsv' });
        const tsvUrl = URL.createObjectURL(tsvBlob);
        const tsvLink = document.createElement('a');
        tsvLink.href = tsvUrl;
        tsvLink.download = `${timestamp}-nihongo-anki-import.tsv`;
        document.body.appendChild(tsvLink);
        tsvLink.click();
        document.body.removeChild(tsvLink);
        URL.revokeObjectURL(tsvUrl);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export conversations. Please try again.');
    }
  };

  const handleImportConversations = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let importedData = JSON.parse(e.target?.result as string);
        
        // Handle both array format (reference format) and object format
        if (!Array.isArray(importedData)) {
          // Try to extract conversations from object format
          if (importedData.conversations && Array.isArray(importedData.conversations)) {
            importedData = importedData.conversations;
          } else {
            alert('Invalid file format. Please select a valid conversation file.');
            return;
          }
        }

        // Validate the imported data structure (matching reference format)
        if (!Array.isArray(importedData) || importedData.length === 0) {
          alert('Invalid file format. Please select a valid conversation file.');
          return;
        }

        // Convert imported data to the expected format (matching reference format)
        const importedConversations: Conversation[] = [];
        
        importedData.forEach((item: any, index: number) => {
          if (item.wordDetails && item.conversations && Array.isArray(item.conversations)) {
            // Handle reference format (wordDetails + conversations)
            item.conversations.forEach((conv: any, convIndex: number) => {
              if (conv.title && conv.dialogue && Array.isArray(conv.dialogue)) {
                const conversation: Conversation = {
                  id: `${Date.now()}-${index}-${convIndex}`,
                  title: conv.title,
                  words: item.wordDetails?.kanji ? [item.wordDetails.kanji] : [],
                  scenario: 'IT engineering company - ' + (conv.title || 'Business Conversation'),
                  service: 'imported',
                  createdAt: new Date(),
                  dialogue: conv.dialogue.map((d: any) => ({
                    speaker: d.speaker || 'Person A',
                    japanese: d.japanese || '',
                    japaneseWithFurigana: d.japanese || '',
                    romaji: d.romaji || '',
                    english: d.english || ''
                  }))
                };
                importedConversations.push(conversation);
              }
            });
          } else if (item.id && item.title && item.dialogue) {
            // Handle app native format
            const conversation: Conversation = {
              id: item.id || Date.now().toString() + index,
              title: item.title,
              words: item.words || [],
              scenario: item.scenario || 'Imported',
              service: item.service || 'imported',
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              dialogue: item.dialogue?.map((d: any) => ({
                speaker: d.speaker || 'Person A',
                japanese: d.japanese || '',
                japaneseWithFurigana: d.japaneseWithFurigana || d.japanese || '',
                romaji: d.romaji || '',
                english: d.english || ''
              })) || []
            };
            importedConversations.push(conversation);
          }
        });

        if (importedConversations.length === 0) {
          alert('No valid conversations found in the file.');
          return;
        }

        // Add imported conversations to existing ones
        setConversations(prev => [...importedConversations, ...prev]);
        alert(`Successfully imported ${importedConversations.length} conversations!`);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import conversations. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
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
      const currentConfig = loadConfig();
      const newConfig = { ...currentConfig, geminiApiKey: result.key! };
      saveConfig(newConfig);
    } else {
      alert(`Failed to import API key: ${result.error}`);
    }
    
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Generate Conversation</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vocabulary Words (comma separated)
            </label>
            <textarea
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="e.g., 具体的, 基本的, 確認"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario (optional)
            </label>
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g., Code review meeting, Daily standup, Client presentation"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Model
            </label>
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between text-left"
              >
                <span>{FREE_GEMINI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {modelDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {FREE_GEMINI_MODELS.filter(m => m.provider === 'puter').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-gray-500">Free via Puter.js</div>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium">API Models (Requires Key)</div>
                    {FREE_GEMINI_MODELS.filter(m => m.provider === 'gemini').map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500">Requires API key</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !words.trim()}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Conversation
              </>
            )}
          </button>

          {/* Import/Export Section - Always Available */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleImportConversations}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              title="Import conversations from JSON"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={handleImportApiKey}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              title="Import API key from file"
            >
              <Key className="w-4 h-4" />
              Import Key
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {conversations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Results</h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <ToggleButton
                  label="Furigana"
                  active={showFurigana}
                  onClick={() => setShowFurigana(!showFurigana)}
                />
                <ToggleButton
                  label="Romaji"
                  active={showRomaji}
                  onClick={() => setShowRomaji(!showRomaji)}
                />
                <ToggleButton
                  label="English"
                  active={showEnglish}
                  onClick={() => setShowEnglish(!showEnglish)}
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    title="Export conversations"
                  >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className={`w-4 h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {exportDropdownOpen && (
                    <div className="absolute z-10 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg min-w-48">
                      <button
                        onClick={() => {
                          handleExportConversations('json');
                          setExportDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium">JSON</div>
                          <div className="text-xs text-gray-500">Full data with metadata</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleExportConversations('csv');
                          setExportDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium">CSV</div>
                          <div className="text-xs text-gray-500">Spreadsheet format</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleExportConversations('anki');
                          setExportDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-medium">Anki</div>
                          <div className="text-xs text-gray-500">Flashcard import format</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {conversations.map((conv) => (
              <div key={conv.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-800">{conv.title}</h3>
                  <button
                    onClick={() => handleDelete(conv.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Word Details and Explanation */}
                {(conv as any).wordDetails && ((conv as any).wordDetails.kanji || (conv as any).wordDetails.kana) && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-blue-800">Word Details:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {(conv as any).wordDetails.kanji && (
                        <div><span className="font-medium text-gray-600">Kanji:</span> <span className="text-lg">{(conv as any).wordDetails.kanji}</span></div>
                      )}
                      {(conv as any).wordDetails.kana && (
                        <div><span className="font-medium text-gray-600">Kana:</span> <span>{(conv as any).wordDetails.kana}</span></div>
                      )}
                      {(conv as any).wordDetails.romaji && (
                        <div><span className="font-medium text-gray-600">Romaji:</span> <span className="italic">{(conv as any).wordDetails.romaji}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {(conv as any).meaning && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 mb-1">Meaning & Context:</div>
                    <div className="text-sm text-gray-700">{(conv as any).meaning}</div>
                  </div>
                )}

                <div className="space-y-3">
                  {conv.dialogue.map((line, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="font-medium text-blue-600 min-w-[60px]">{line.speaker}:</span>
                      <div className="flex-1">
                        <div className="text-lg">
                          <Furigana text={line.japaneseWithFurigana} showFurigana={showFurigana} />
                        </div>
                        {showRomaji && (
                          <div className="text-sm text-gray-500 italic">{line.romaji}</div>
                        )}
                        {showEnglish && (
                          <div className="text-sm text-gray-600">{line.english}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  Generated with {conv.service} • {conv.createdAt.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
