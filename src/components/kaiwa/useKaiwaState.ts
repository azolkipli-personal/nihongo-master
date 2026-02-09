import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../../types';
import { generateConversation } from '../../services/llm';
import { loadConfig } from '../../utils/configManager';
import { saveSession } from '../../utils/sessionStorage';

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

    useEffect(() => {
        const practiceWord = sessionStorage.getItem('kaiwa_practice_word');
        if (practiceWord) {
            setWords(practiceWord);
            sessionStorage.removeItem('kaiwa_practice_word');
        }
    }, []);

    const handleGenerate = useCallback(async () => {
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

            // Use the config directly for model selection instead of local state
            const model = config.selectedService === 'gemini' ? config.geminiModel : config.ollamaModel;

            const result = await generateConversation(wordList, scenario, config.selectedService, apiKey, config.ollamaUrl, model);

            const newConversations: Conversation[] = result.conversations.map((conv: any, idx: number) => ({
                id: Date.now().toString() + idx,
                title: conv.title || `${wordList[0]} - Business Context`,
                words: wordList,
                scenario: scenario || 'IT engineering work conversation',
                service: config.selectedService,
                createdAt: new Date(),
                dialogue: conv.dialogue || [],
                wordDetails: conv.wordDetails,
                meaning: conv.meaning || `${wordList.join(', ')} in IT engineering context`,
            }));

            if (!newConversations || newConversations.length === 0) {
                throw new Error('No conversations generated');
            }

            newConversations.forEach((conv: any) => {
                if (!conv.meaning || !conv.wordDetails) {
                    conv.meaning = conv.meaning || `${wordList.join(', ')} - Professional IT terminology.`;
                    conv.wordDetails = conv.wordDetails || { kanji: wordList[0] || '', kana: '', romaji: '' };
                }
            });

            setConversations(prev => [...newConversations, ...prev]);

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
    }, [words, scenario]);

    const handleDelete = useCallback((id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id));
    }, []);

    const handleExport = useCallback((format: 'json' | 'csv' | 'anki') => {
        if (conversations.length === 0) {
            alert('No conversations to export');
            return;
        }

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');

        try {
            let content: string;
            let mimeType: string;
            let extension: string;

            if (format === 'json') {
                const exportData = conversations.map(conv => ({
                    wordDetails: { kanji: conv.words?.[0] || '', kana: '', romaji: '' },
                    meaning: `${conv.words?.[0]} in the context of ${conv.scenario}`,
                    conversations: [{ title: conv.title, dialogue: conv.dialogue }]
                }));
                content = JSON.stringify(exportData, null, 2);
                mimeType = 'application/json';
                extension = 'json';
            } else if (format === 'csv') {
                content = 'Word,Meaning,Conversation Title,Speaker,Japanese,Romaji,English\n';
                conversations.forEach(conv => {
                    const mainWord = conv.words?.[0] || 'conversation';
                    conv.dialogue.forEach(d => {
                        content += `"${mainWord}","${mainWord} in ${conv.scenario}","${conv.title}","${d.speaker}","${d.japaneseWithFurigana}","${d.romaji}","${d.english}"\n`;
                    });
                });
                mimeType = 'text/csv';
                extension = 'csv';
            } else {
                content = 'Japanese\tJapanese with Furigana\tRomaji\tEnglish\tSpeaker\tWord\n';
                conversations.forEach(conv => {
                    const mainWord = conv.words?.[0] || 'conversation';
                    conv.dialogue.forEach(d => {
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
    }, [conversations]);

    const handleImportConversations = useCallback((data: any[]) => {
        const importedConversations: Conversation[] = [];

        data.forEach((item: any, index: number) => {
            if (item.wordDetails && item.conversations) {
                item.conversations.forEach((conv: any, convIndex: number) => {
                    if (conv.title && conv.dialogue) {
                        importedConversations.push({
                            id: `${Date.now()}-${index}-${convIndex}`,
                            title: conv.title,
                            words: item.wordDetails?.kanji ? [item.wordDetails.kanji] : [],
                            scenario: 'Imported',
                            service: 'imported',
                            createdAt: new Date(),
                            dialogue: conv.dialogue.map((d: any) => ({
                                speaker: d.speaker || 'A',
                                japanese: d.japanese || '',
                                japaneseWithFurigana: d.japanese || '',
                                romaji: d.romaji || '',
                                english: d.english || ''
                            }))
                        });
                    }
                });
            } else if (item.id && item.title && item.dialogue) {
                importedConversations.push({
                    id: item.id || Date.now().toString() + index,
                    title: item.title,
                    words: item.words || [],
                    scenario: item.scenario || 'Imported',
                    service: item.service || 'imported',
                    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                    dialogue: item.dialogue || []
                });
            }
        });

        if (importedConversations.length > 0) {
            setConversations(prev => [...importedConversations, ...prev]);
        }
        return importedConversations.length;
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
        // Setters
        setWords,
        setScenario,
        setShowFurigana,
        setShowRomaji,
        setShowEnglish,
        setExportDropdownOpen,
        // Actions
        handleGenerate,
        handleDelete,
        handleExport,
        handleImportConversations,
    };
}

