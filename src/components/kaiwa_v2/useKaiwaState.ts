import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../../types';
import { generateConversation } from '../../services/llm';
import { loadConfig } from '../../utils/configManager';
import { saveSession } from '../../utils/sessionStorage';

// LocalStorage keys for persisting kaiwa state
const STORAGE_KEYS = {
  CONVERSATIONS: 'kaiwa_conversations',
  WORDS: 'kaiwa_words',
  SCENARIO: 'kaiwa_scenario',
  CEFR_LEVEL: 'kaiwa_cefr_level',
};

export function useKaiwaState() {
  const [words, setWords] = useState('');
  const [scenario, setScenario] = useState('work conversations in an IT engineering company');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    // Check for practice word from other tabs first (takes priority)
    const practiceWord = sessionStorage.getItem('kaiwa_practice_word');
    if (practiceWord) {
      setWords(practiceWord);
      sessionStorage.removeItem('kaiwa_practice_word');
      setIsLoaded(true);
      return;
    }

    // Load persisted state from localStorage
    try {
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const savedWords = localStorage.getItem(STORAGE_KEYS.WORDS);
      const savedScenario = localStorage.getItem(STORAGE_KEYS.SCENARIO);
      const savedCefrLevel = localStorage.getItem(STORAGE_KEYS.CEFR_LEVEL);

      if (savedConversations) {
        const parsed = JSON.parse(savedConversations);
        // Convert date strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
        }));
        setConversations(conversationsWithDates);
      }

      if (savedWords) {
        setWords(savedWords);
      }

      if (savedScenario) {
        setScenario(savedScenario);
      }

      if (savedCefrLevel) {
        setCefrLevel(savedCefrLevel);
      }
    } catch (e) {
      console.error('Failed to load kaiwa state from localStorage:', e);
    }

    setIsLoaded(true);
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      } catch (e) {
        console.error('Failed to save conversations to localStorage:', e);
      }
    }
  }, [conversations, isLoaded]);

  // Save words to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        if (words) {
          localStorage.setItem(STORAGE_KEYS.WORDS, words);
        } else {
          localStorage.removeItem(STORAGE_KEYS.WORDS);
        }
      } catch (e) {
        console.error('Failed to save words to localStorage:', e);
      }
    }
  }, [words, isLoaded]);

  // Save scenario to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEYS.SCENARIO, scenario);
      } catch (e) {
        console.error('Failed to save scenario to localStorage:', e);
      }
    }
  }, [scenario, isLoaded]);

  // Save CEFR level to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEYS.CEFR_LEVEL, cefrLevel);
      } catch (e) {
        console.error('Failed to save CEFR level to localStorage:', e);
      }
    }
  }, [cefrLevel, isLoaded]);

  const handleGenerate = useCallback(async () => {
    const config = loadConfig();
    const apiKey =
      config.selectedService === 'gemini'
        ? config.geminiApiKey
        : config.selectedService === 'openrouter'
          ? config.openrouterApiKey
          : 'ollama';

    if (!apiKey && config.selectedService !== 'ollama') {
      setError(`Please set your ${config.selectedService} API key in settings`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const wordList = words
        .split(/[,\n]/)
        .map((w) => w.trim())
        .filter(Boolean);

      if (wordList.length === 0) {
        setError('Please enter at least one vocabulary word');
        return;
      }

      // Use the config directly for model selection instead of local state
      const model = config.selectedService === 'gemini' ? config.geminiModel : config.ollamaModel;

      const result = await generateConversation(
        wordList,
        scenario,
        config.selectedService,
        apiKey,
        config.ollamaUrl,
        model,
        cefrLevel
      );

      const newConversations: Conversation[] = [];

      // Flatten the results:Each wordResult has a list of conversations
      result.results.forEach((wordResult: any, wordIdx: number) => {
        const conversationsForWord = wordResult.conversations || [];
        conversationsForWord.forEach((conv: any, convIdx: number) => {
          newConversations.push({
            id: `${Date.now()}-${wordIdx}-${convIdx}`,
            title: conv.title || `${wordResult.wordDetails.kanji} - Practice`,
            words: [wordResult.wordDetails.kanji], // Specific word for this block
            scenario: scenario || 'Japanese conversation practice',
            service: config.selectedService,
            createdAt: new Date(),
            dialogue: conv.dialogue || [],
            wordDetails: wordResult.wordDetails,
            meaning: wordResult.meaning,
          });
        });
      });

      if (!newConversations || newConversations.length === 0) {
        throw new Error('No conversations generated');
      }

      setConversations((prev) => [...newConversations, ...prev]);

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
  }, [words, scenario, cefrLevel]);

  const handleDelete = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleExport = useCallback(
    (format: 'json' | 'csv' | 'anki') => {
      if (conversations.length === 0) {
        alert('No conversations to export');
        return;
      }

      const now = new Date();
      const timestamp =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0');

      try {
        let content: string;
        let mimeType: string;
        let extension: string;

        if (format === 'json') {
          const exportData = conversations.map((conv) => ({
            wordDetails: { kanji: conv.words?.[0] || '', kana: '', romaji: '' },
            meaning: `${conv.words?.[0]} in the context of ${conv.scenario}`,
            conversations: [{ title: conv.title, dialogue: conv.dialogue }],
          }));
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
        } else if (format === 'csv') {
          content = 'Word,Meaning,Conversation Title,Speaker,Japanese,Romaji,English\n';
          conversations.forEach((conv) => {
            const mainWord = conv.words?.[0] || 'conversation';
            conv.dialogue.forEach((d) => {
              content += `"${mainWord}","${mainWord} in ${conv.scenario}","${conv.title}","${d.speaker}","${d.japaneseWithFurigana}","${d.romaji}","${d.english}"\n`;
            });
          });
          mimeType = 'text/csv';
          extension = 'csv';
        } else {
          content = 'Japanese\tJapanese with Furigana\tRomaji\tEnglish\tSpeaker\tWord\n';
          conversations.forEach((conv) => {
            const mainWord = conv.words?.[0] || 'conversation';
            conv.dialogue.forEach((d) => {
              content += `${d.japanese}\t${d.japaneseWithFurigana}\t${d.romaji}\t${d.english}\t${d.speaker}\t${mainWord}\n`;
            });
          });
          mimeType = 'text/tsv';
          extension = 'tsv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${timestamp}-nihongo-conversations.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export conversations.');
      }
    },
    [conversations]
  );

  const handleImportConversations = useCallback((data: any[]) => {
    const importedConversations: Conversation[] = [];

    data.forEach((item: any, index: number) => {
      // Case 1: Conversations Array format (from old export)
      if (item.wordDetails && item.conversations) {
        item.conversations.forEach((conv: any, convIndex: number) => {
          importedConversations.push({
            id: `${Date.now()}-${index}-${convIndex}`,
            title: conv.title || 'Imported Conversation',
            words: item.wordDetails?.kanji ? [item.wordDetails.kanji] : [],
            scenario: 'Imported',
            service: 'imported',
            createdAt: new Date(),
            // Map Word Details and Meaning so MergedInfoBox works
            wordDetails: item.wordDetails,
            meaning: item.meaning,
            dialogue: conv.dialogue.map((d: any) => ({
              speaker: d.speaker || 'A',
              japanese: d.japanese || d.japaneseWithFurigana || '',
              japaneseWithFurigana: d.japaneseWithFurigana || d.japanese || '',
              romaji: d.romaji || '',
              english: d.english || '',
            })),
          });
        });
      }
      // Case 2: Direct Conversation Object format (current app state)
      else if (item.id && item.dialogue) {
        importedConversations.push({
          id: item.id || Date.now().toString() + index,
          title: item.title || 'Imported',
          words: item.words || [],
          scenario: item.scenario || 'Imported',
          service: item.service || 'imported',
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          // Ensure these are preserved
          wordDetails: item.wordDetails,
          meaning: item.meaning,
          dialogue: item.dialogue || [],
        });
      }
    });

    if (importedConversations.length > 0) {
      setConversations((prev) => [...importedConversations, ...prev]);
    }
    return importedConversations.length;
  }, []);

  // Clear all persisted data and reset state
  const handleClearAll = useCallback(() => {
    setConversations([]);
    setWords('');
    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.WORDS);
    } catch (e) {
      console.error('Failed to clear kaiwa state from localStorage:', e);
    }
  }, []);

  return {
    // State
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
    // Setters
    setWords,
    setScenario,
    setShowFurigana,
    setShowRomaji,
    setShowEnglish,
    setExportDropdownOpen,
    setCefrLevel,
    // Actions
    handleGenerate,
    handleDelete,
    handleExport,
    handleImportConversations,
    handleClearAll,
  };
}
