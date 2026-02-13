import { useState } from 'react';
import { Trash2, Play, Pause, Volume2 } from 'lucide-react';
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
        <div className="mb-10 p-8 bg-indigo-50 rounded-3xl border-4 border-indigo-200 shadow-xl overflow-hidden relative">
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
    console.log("🚀 INLINED FINAL CARD LOADED 🚀", conv);

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
            // Ensure we use the stripped text for TTS
            const cleanText = stripFurigana(text);
            console.log('TTS playing text:', cleanText);

            const response = await fetch('http://localhost:8001/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: cleanText }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

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
        <div className="border border-gray-200 rounded-lg p-4 relative bg-white shadow-sm">

            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl text-gray-800">{conv.title}</h3>
                <button
                    onClick={() => onDelete(conv.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {conv.dialogue.map((line, idx) => (
                    <div key={idx} className="flex gap-4 items-start group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <span className="font-bold text-blue-600 min-w-[60px] pt-1">{line.speaker}:</span>
                        <div className="flex-1">
                            <div className="text-lg text-gray-900 mb-1">
                                <Furigana text={line.japaneseWithFurigana} showFurigana={showFurigana} />
                            </div>
                            {showRomaji && (
                                <div className="text-sm text-gray-500 italic mb-0.5">{line.romaji}</div>
                            )}
                            {showEnglish && (
                                <div className="text-sm text-gray-600">{line.english}</div>
                            )}
                        </div>
                        <button
                            onClick={() => playingLine === idx ? stopAudio() : playAudio(line.japaneseWithFurigana, idx)}
                            className={`p-2.5 rounded-full transition-all shadow-sm ${playingLine === idx
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-2 ring-red-100'
                                : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
                                }`}
                        >
                            {loading === idx ? (
                                <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            ) : playingLine === idx ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
                <span>Generated with {conv.service} • {conv.createdAt.toLocaleString()}</span>
                <div className="flex items-center gap-1.5 text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-full">
                    <Volume2 className="w-3 h-3" />
                    <span>Japanese TTS</span>
                </div>
            </div>
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
    return (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 relative">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Conversation Practice</h2>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
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

            <div className="space-y-12">
                {conversations.map((conv, idx) => {
                    // Show info box for the first conversation, or if the focus word has changed
                    const showInfoBox = idx === 0 ||
                        conv.wordDetails?.kanji !== conversations[idx - 1].wordDetails?.kanji;

                    return (
                        <div key={conv.id} className="space-y-6">
                            {showInfoBox && <MergedInfoBox conversation={conv} />}
                            <FinalCard
                                conversation={conv}
                                showFurigana={showFurigana}
                                showRomaji={showRomaji}
                                showEnglish={showEnglish}
                                onDelete={onDelete}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
