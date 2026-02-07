import React, { useState, useEffect } from 'react';
import { Send, Download, Trash2, Loader2, ChevronDown, ChevronRight, Upload, FileText, RefreshCw } from 'lucide-react';
import { generateConversation, GEMINI_MODELS, getOllamaModels } from '../../services/llm';
import { loadConfig, saveConfig, importApiKeyFromFile } from '../../utils/configManager';
import { saveSession } from '../../utils/sessionStorage';
import { Conversation } from '../../types';
import { Furigana } from '../common/Furigana';
import { ToggleButton } from '../common/ToggleButton';

interface KaiwaSession {
  id: string;
  batchId: string;
  wordDetails: {
    kanji: string;
    kana: string;
    romaji: string;
  };
  meaning: string;
  conversations: Conversation[];
  createdAt: Date;
  service: string;
  isExpanded: boolean;
}

export function KaiwaTab() {
  const [words, setWords] = useState('');
  const [scenario, setScenario] = useState('work conversations in an IT engineering company');
  const [sessions, setSessions] = useState<KaiwaSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Display states
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [currentService, setCurrentService] = useState('gemini');
  const [refreshingModels, setRefreshingModels] = useState(false);

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [fileInputRef] = useState<React.RefObject<HTMLInputElement>>(() => React.createRef());

  useEffect(() => {
    // Load initial config state
    const config = loadConfig();
    setCurrentService(config.selectedService);
    setShowFurigana(config.showFurigana !== undefined ? config.showFurigana : true);
    setShowRomaji(config.showRomaji !== undefined ? config.showRomaji : true);
    setShowEnglish(config.showEnglish !== undefined ? config.showEnglish : true);
    
    if (config.selectedService === 'ollama') {
      fetchOllamaModels(config.ollamaUrl);
    }

    // Check for pending practice word from Tango tab
    const practiceWord = sessionStorage.getItem('kaiwa_practice_word');
    if (practiceWord) {
      setWords(practiceWord);
      sessionStorage.removeItem('kaiwa_practice_word');
    }
  }, []);

  const fetchOllamaModels = async (url?: string) => {
    setRefreshingModels(true);
    try {
      const models = await getOllamaModels(url);
      setOllamaModels(models);
      if (models.length > 0 && !models.includes(selectedModel)) {
        setSelectedModel(models[0]);
      }
    } catch (e) {
      console.error('Failed to fetch Ollama models', e);
    } finally {
      setRefreshingModels(false);
    }
  };

  const handleGenerate = async () => {
    const config = loadConfig();
    const apiKey = config.selectedService === 'gemini' ? config.geminiApiKey :
                   config.selectedService === 'openrouter' ? config.openrouterApiKey : 'ollama';

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

      const result = await generateConversation(wordList, scenario, config.selectedService, apiKey, config.ollamaUrl, selectedModel);
      
      const batchId = Date.now().toString();
      
      // Extract common details from the first conversation or fallback
      const commonWordDetails = result.conversations[0]?.wordDetails || {
        kanji: wordList[0] || '',
        kana: '',
        romaji: ''
      };

      const commonMeaning = result.conversations[0]?.meaning || 
        `${wordList.join(', ')} in IT engineering context - Professional business terminology and usage patterns.`;

      const newConversations: Conversation[] = result.conversations.map((conv: any, idx: number) => ({
        id: `${batchId}-${idx}`,
        title: conv.title || `Conversation ${idx + 1}`,
        words: wordList,
        scenario: scenario || 'Business Context',
        service: config.selectedService,
        createdAt: new Date(),
        dialogue: (conv.dialogue || []).map((line: any) => ({
          ...line,
          japaneseWithFurigana: line.japaneseWithFurigana || line.japanese || ''
        })),
        wordDetails: commonWordDetails,
        meaning: commonMeaning
      }));

      if (!newConversations || newConversations.length === 0) {
        throw new Error('No conversations generated');
      }

      const newSession: KaiwaSession = {
        id: batchId,
        batchId: batchId,
        wordDetails: commonWordDetails,
        meaning: commonMeaning,
        conversations: newConversations,
        createdAt: new Date(),
        service: config.selectedService,
        isExpanded: true
      };

      setSessions(prev => [newSession, ...prev]);
      
      // Save session metadata
      saveSession({
        id: batchId,
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

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const toggleSessionExpansion = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const handleExportConversations = (format: 'json' | 'csv' | 'anki' = 'json') => {
    if (sessions.length === 0) {
      alert('No conversations to export');
      return;
    }

    try {
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0') +
                       now.getHours().toString().padStart(2, '0') +
                       now.getMinutes().toString().padStart(2, '0');

      if (format === 'json') {
        const exportData = sessions.map(s => ({
          wordDetails: s.wordDetails,
          meaning: s.meaning,
          conversations: s.conversations.map(conv => ({
            title: conv.title,
            dialogue: conv.dialogue.map(d => ({
              speaker: d.speaker,
              japanese: d.japaneseWithFurigana || d.japanese,
              romaji: d.romaji,
              english: d.english
            }))
          }))
        }));

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
        let csv = 'Word,Meaning,Conversation Title,Speaker,Japanese,Romaji,English\n';
        sessions.forEach(s => {
          s.conversations.forEach(conv => {
            conv.dialogue.forEach(d => {
              csv += `"${s.wordDetails.kanji}","${s.meaning}","${conv.title}","${d.speaker}","${d.japaneseWithFurigana || d.japanese}","${d.romaji}","${d.english}"\n`;
            });
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
        let tsv = 'Japanese\tJapanese with Furigana\tRomaji\tEnglish\tSpeaker\tWord\tMeaning\tConversation Title\n';
        sessions.forEach(s => {
          s.conversations.forEach(conv => {
            conv.dialogue.forEach(d => {
              tsv += `${d.japanese}\t${d.japaneseWithFurigana || d.japanese}\t${d.romaji}\t${d.english}\t${d.speaker}\t${s.wordDetails.kanji}\t${s.meaning}\t${conv.title}\n`;
            });
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
      alert('Failed to export conversations.');
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
        if (!Array.isArray(importedData)) {
          if (importedData.conversations && Array.isArray(importedData.conversations)) {
            importedData = [importedData];
          } else {
            alert('Invalid file format.');
            return;
          }
        }

        const newSessions: KaiwaSession[] = importedData.map((item: any, idx: number) => {
          const batchId = Date.now().toString() + idx;
          return {
            id: batchId,
            batchId: batchId,
            wordDetails: item.wordDetails || { kanji: '', kana: '', romaji: '' },
            meaning: item.meaning || '',
            createdAt: new Date(),
            service: 'imported',
            isExpanded: true,
            conversations: (item.conversations || []).map((conv: any, cIdx: number) => ({
              id: `${batchId}-${cIdx}`,
              title: conv.title || 'Imported Conversation',
              words: [],
              scenario: 'Imported',
              service: 'imported',
              createdAt: new Date(),
              dialogue: (conv.dialogue || []).map((d: any) => ({
                speaker: d.speaker || 'Person A',
                japanese: d.japanese || '',
                japaneseWithFurigana: d.japanese || '',
                romaji: d.romaji || '',
                english: d.english || ''
              }))
            }))
          };
        });

        setSessions(prev => [...newSessions, ...prev]);
        alert(`Successfully imported ${newSessions.length} sessions!`);
      } catch (error) {
        alert('Import failed.');
      }
    };
    reader.readAsText(file);
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
              AI Model ({currentService === 'ollama' ? 'Local Ollama' : 'Google Gemini'})
            </label>
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between text-left"
              >
                <span>
                  {currentService === 'ollama' 
                    ? (selectedModel || 'Select a model...') 
                    : (GEMINI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel)
                  }
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {modelDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {(currentService === 'ollama' ? ollamaModels : GEMINI_MODELS.map(m => m.id)).map((model) => (
                    <button
                      key={typeof model === 'string' ? model : model}
                      onClick={() => {
                        setSelectedModel(typeof model === 'string' ? model : (model as any).id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === (typeof model === 'string' ? model : (model as any).id) ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                    >
                      {typeof model === 'string' ? model : (GEMINI_MODELS.find(m => m.id === model)?.name || model)}
                    </button>
                  ))}
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
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><Send className="w-5 h-5" /> Generate Conversation</>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {sessions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
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
                <button
                  onClick={handleImportConversations}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Import"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    className="p-2 text-gray-500 hover:text-green-500 transition-colors"
                    title="Export"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {exportDropdownOpen && (
                    <div className="absolute z-10 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-32 py-1">
                      <button onClick={() => { handleExportConversations('json'); setExportDropdownOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">JSON</button>
                      <button onClick={() => { handleExportConversations('csv'); setExportDropdownOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">CSV</button>
                      <button onClick={() => { handleExportConversations('anki'); setExportDropdownOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Anki</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                {/* Unified Box: Word Details + Meaning */}
                <div 
                  className={`p-6 cursor-pointer transition-colors ${session.isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleSessionExpansion(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          Vocabulary Focus
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {session.wordDetails.kanji || "General Practice"}
                        </h3>
                      </div>

                      {session.isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Properties</div>
                            <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex items-center gap-6">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Kanji</div>
                                <div className="text-3xl font-black text-gray-900">{session.wordDetails.kanji}</div>
                              </div>
                              <div className="h-10 w-px bg-gray-100" />
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Reading</div>
                                <div className="text-xl font-medium text-gray-700">{session.wordDetails.kana}</div>
                              </div>
                              <div className="h-10 w-px bg-gray-100" />
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Romaji</div>
                                <div className="text-lg italic text-gray-600">{session.wordDetails.romaji}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meaning & Context</div>
                            <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm min-h-[80px] flex items-center">
                              <p className="text-gray-700 leading-relaxed">{session.meaning}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className={`p-1 rounded-full bg-gray-100 text-gray-500 transition-transform duration-300 ${session.isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversations Section */}
                {session.isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="p-6 space-y-12">
                      {session.conversations.map((conv, cIdx) => (
                        <div key={conv.id} className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm">
                              {cIdx + 1}
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 tracking-tight">{conv.title}</h4>
                          </div>

                          <div className="space-y-6 pl-11 relative">
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-blue-50" />
                            {conv.dialogue.map((line, lIdx) => (
                              <div key={lIdx} className="relative group">
                                <div className="absolute -left-[32px] top-[14px] w-2 h-2 rounded-full bg-blue-200 group-hover:bg-blue-400 transition-colors" />
                                <div className="flex items-start gap-4">
                                  <span className="font-black text-blue-600 min-w-[60px] text-[10px] uppercase tracking-widest pt-2">
                                    {line.speaker}
                                  </span>
                                  <div className="flex-1 space-y-2">
                                    <div className="text-xl leading-relaxed font-medium">
                                      <Furigana text={line.japaneseWithFurigana || line.japanese} showFurigana={showFurigana} />
                                    </div>
                                    {showRomaji && line.romaji && (
                                      <div className="text-sm text-gray-400 font-light italic">{line.romaji}</div>
                                    )}
                                    {showEnglish && line.english && (
                                      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100">
                                        {line.english}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-t border-gray-100">
                      <span>Model: {session.service}</span>
                      <span>{session.createdAt.toLocaleString()}</span>
                    </div>
                  </div>
                )}
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
    </div>
  );
}
