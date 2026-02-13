import { useState } from 'react';
import { Trash2, Play, Pause, ChevronDown, ChevronRight } from 'lucide-react';
import { Conversation } from '../../types';
import { ToggleButton } from '../common/ToggleButton';
import { ExportDropdown } from './ExportDropdown';
import { Furigana } from '../common/Furigana';

interface ConversationCardProps {
    conversation: Conversation;
    showFurigana: boolean;
    showRomaji: boolean;
    showEnglish: boolean;
    onDelete: (id: string) => void;
}

const stripFurigana = (text: string): string => {
    // 1. Remove everything in brackets: 漢字[ふりがな] -> 漢字
    let cleaned = text.replace(/\[.*?\]/g, '').replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').replace(/［.*?］/g, '');

    // 2. Remove HTML tags just in case
    cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");

    return cleaned.trim();
};

function MergedInfoBox({ conversation: conv }: { conversation: Conversation }) {
    if (!conv || (!(conv as any).wordDetails && !(conv as any).meaning)) return null;

    const meaningText = (conv as any).meaning || '';
    const meaningLines = meaningText.split('\n').filter((l: string) => l.trim() !== '');
    const mainMeaning = meaningLines[0];
    const contextLines = meaningLines.slice(1);

    return (
        <div className="mb-6 p-8 bg-indigo-50 rounded-3xl border-4 border-indigo-200 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600"></div>

            <div className="text-center font-black text-indigo-900 mb-8 border-b-2 border-indigo-100 pb-4 text-2xl uppercase tracking-widest">
                📚 Learning Focus: {(conv as any).wordDetails?.kanji || conv.title}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Word Details Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-black text-indigo-700 text-sm uppercase tracking-wider">
                        <span className="bg-indigo-600 text-white p-1 rounded">01</span> Word Structure
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-2xl p-4 border-2 border-blue-100 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
                            <span className="text-[10px] font-bold text-blue-400 uppercase mb-2">Kanji</span>
                            <span className="text-3xl font-black text-gray-900">{(conv as any).wordDetails?.kanji}</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border-2 border-blue-100 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
                            <span className="text-[10px] font-bold text-blue-400 uppercase mb-2">Hiragana</span>
                            <span className="text-2xl font-bold text-gray-800">{(conv as any).wordDetails?.hiragana || (conv as any).wordDetails?.kana}</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border-2 border-blue-100 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
                            <span className="text-[10px] font-bold text-blue-400 uppercase mb-2">Romaji</span>
                            <span className="text-lg italic font-medium text-gray-700">{(conv as any).wordDetails?.romaji}</span>
                        </div>
                    </div>
                </div>

                {/* Meaning & Context Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-black text-purple-700 text-sm uppercase tracking-wider">
                        <span className="bg-purple-600 text-white p-1 rounded">02</span> Meaning & Usage
                    </div>
                    <div className="bg-white rounded-2xl p-6 border-2 border-purple-100 shadow-sm h-full">
                        <div className="font-bold text-gray-900 text-xl mb-4 border-b border-gray-100 pb-2">
                            {mainMeaning}
                        </div>
                        <div className="text-gray-600 leading-relaxed text-sm text-justify">
                            {contextLines.length > 0 ? (
                                contextLines.map((line: string, i: number) => (
                                    <p key={i} className={i > 0 ? 'mt-3' : ''}>{line}</p>
                                ))
                            ) : (
                                <p>No context provided.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FinalCard({
    conversation: conv,
    showFurigana,
    showRomaji,
    showEnglish,
    onDelete,
}: ConversationCardProps) {
    const [playingLine, setPlayingLine] = useState<number | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [loading, setLoading] = useState<number | null>(null);

    const playAudio = async (text: string, lineIndex: number) => {
        if (audio) {
            audio.pause();
            setAudio(null);
        }

        if (playingLine === lineIndex) {
            setPlayingLine(null);
            return;
        }

        setLoading(lineIndex);

        try {
            const cleanText = stripFurigana(text);
            const response = await fetch('http://localhost:8001/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText }),
            });

            if (!response.ok) throw new Error('TTS request failed');

            const data = await response.json();
            const audioUrl = `http://localhost:8001${data.audio_url}`;
            const newAudio = new Audio(audioUrl);
            newAudio.play();

            newAudio.onended = () => {
                setPlayingLine(null);
                setLoading(null);
            };

            setAudio(newAudio);
            setPlayingLine(lineIndex);
            setLoading(null);
        } catch (error) {
            console.error('TTS Error:', error);
            setLoading(null);
            alert('Failed to generate audio. Make sure TTS server is running.');
        }
    };

    const stopAudio = () => {
        if (audio) {
            audio.pause();
            setAudio(null);
        }
        setPlayingLine(null);
        setLoading(null);
    };

    return (
        <div className="border border-gray-200 rounded-xl p-4 relative bg-gray-50/50 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-800">{conv.title}</h3>
                <button
                    onClick={() => onDelete(conv.id)}
                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-full transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                {conv.dialogue.map((line, idx) => (
                    <div key={idx} className="flex gap-4 items-start group hover:bg-white p-2 rounded-lg transition-colors shadow-none hover:shadow-sm">
                        <span className="font-bold text-blue-600 min-w-[60px] pt-1 text-sm">{line.speaker}:</span>
                        <div className="flex-1">
                            <div className="text-gray-900 mb-1 leading-relaxed">
                                <Furigana text={line.japaneseWithFurigana} showFurigana={showFurigana} />
                            </div>
                            {showRomaji && (
                                <div className="text-xs text-gray-400 italic mb-0.5 tracking-tight">{line.romaji}</div>
                            )}
                            {showEnglish && (
                                <div className="text-xs text-gray-500 leading-tight">{line.english}</div>
                            )}
                        </div>
                        <button
                            onClick={() => playingLine === idx ? stopAudio() : playAudio(line.japaneseWithFurigana, idx)}
                            className={`p-2 rounded-full transition-all ${playingLine === idx
                                ? 'bg-red-100 text-red-600'
                                : 'bg-white text-blue-500 border border-gray-100 hover:border-blue-200'
                                }`}
                        >
                            {loading === idx ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            ) : playingLine === idx ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface WordBlockProps {
    word: string;
    conversations: Conversation[];
    showFurigana: boolean;
    showRomaji: boolean;
    showEnglish: boolean;
    onDelete: (id: string) => void;
}

function WordBlock({ word, conversations, showFurigana, showRomaji, showEnglish, onDelete }: WordBlockProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const firstConv = conversations[0];

    return (
        <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm mb-8">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Word Block
                    </span>
                    <h3 className="text-xl font-black text-indigo-900">
                        {word} <span className="text-indigo-400 font-medium ml-2 text-sm">({conversations.length} examples)</span>
                    </h3>
                </div>
                {isCollapsed ? <ChevronRight className="text-indigo-400" /> : <ChevronDown className="text-indigo-400" />}
            </button>

            {!isCollapsed && (
                <div className="p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <MergedInfoBox conversation={firstConv} />
                    <div className="grid grid-cols-1 gap-6">
                        {conversations.map((conv) => (
                            <FinalCard
                                key={conv.id}
                                conversation={conv}
                                showFurigana={showFurigana}
                                showRomaji={showRomaji}
                                showEnglish={showEnglish}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface KaiwaResultsProps {
    conversations: Conversation[];
    showFurigana: boolean;
    showRomaji: boolean;
    showEnglish: boolean;
    exportDropdownOpen: boolean;
    onToggleFurigana: () => void;
    onToggleRomaji: () => void;
    onToggleEnglish: () => void;
    onExportDropdownToggle: () => void;
    onExport: (format: 'json' | 'csv' | 'anki') => void;
    onDelete: (id: string) => void;
}

export function KaiwaResults({
    conversations,
    showFurigana,
    showRomaji,
    showEnglish,
    exportDropdownOpen,
    onToggleFurigana,
    onToggleRomaji,
    onToggleEnglish,
    onExportDropdownToggle,
    onExport,
    onDelete,
}: KaiwaResultsProps) {
    if (conversations.length === 0) return null;

    // Group conversations by word (kanji)
    const wordGroups: Record<string, Conversation[]> = {};
    conversations.forEach(conv => {
        const kanji = conv.wordDetails?.kanji || 'Vocabulary';
        if (!wordGroups[kanji]) wordGroups[kanji] = [];
        wordGroups[kanji].push(conv);
    });

    const words = Object.keys(wordGroups);

    return (
        <div className="bg-transparent relative space-y-8">
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Practice Dashboard</h2>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        <ToggleButton label="Furigana" active={showFurigana} onClick={onToggleFurigana} />
                        <ToggleButton label="Romaji" active={showRomaji} onClick={onToggleRomaji} />
                        <ToggleButton label="English" active={showEnglish} onClick={onToggleEnglish} />
                    </div>
                    <ExportDropdown
                        isOpen={exportDropdownOpen}
                        onToggle={onExportDropdownToggle}
                        onExport={(format) => {
                            onExport(format);
                            onExportDropdownToggle();
                        }}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {words.map((word) => (
                    <WordBlock
                        key={word}
                        word={word}
                        conversations={wordGroups[word]}
                        showFurigana={showFurigana}
                        showRomaji={showRomaji}
                        showEnglish={showEnglish}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}
