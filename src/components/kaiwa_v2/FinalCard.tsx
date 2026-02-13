import { Trash2, Play, Pause, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Conversation } from '../../types';
import { Furigana } from '../common/Furigana';

interface ConversationCardProps {
    conversation: Conversation;
    showFurigana: boolean;
    showRomaji: boolean;
    showEnglish: boolean;
    onDelete: (id: string) => void;
}

export function FinalCard({
    conversation: conv,
    showFurigana,
    showRomaji,
    showEnglish,
    onDelete,
}: ConversationCardProps) {
    console.log("🚀 FINAL CARD LOADED 🚀", conv);

    const [playingLine, setPlayingLine] = useState<number | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [loading, setLoading] = useState<number | null>(null);

    // Helper function to strip furigana HTML and get clean kana text
    const stripFurigana = (textWithFurigana: string): string => {
        return textWithFurigana.replace(/<ruby>(.*?)<rt>.*?<\/rt><\/ruby>/g, '$1');
    };

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
            const response = await fetch('http://localhost:8001/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
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
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
                FINAL VERSION
            </div>

            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl text-gray-800">{conv.title}</h3>
                <button
                    onClick={() => onDelete(conv.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* MERGED BOX START */}
            {((conv as any).wordDetails || (conv as any).meaning) && (
                <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-100 shadow-sm">
                    {/* Word Details Section */}
                    {(conv as any).wordDetails && ((conv as any).wordDetails.kanji || (conv as any).wordDetails.kana) && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 font-bold text-blue-800 mb-3 text-sm uppercase tracking-wide">
                                📚 Word Details
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(conv as any).wordDetails.kanji && (
                                    <div className="bg-white/80 rounded-lg px-3 py-2 border border-blue-100">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Kanji</span>
                                        <span className="text-xl text-gray-900 font-medium">{(conv as any).wordDetails.kanji}</span>
                                    </div>
                                )}
                                {(conv as any).wordDetails.kana && (
                                    <div className="bg-white/80 rounded-lg px-3 py-2 border border-blue-100">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Hiragana</span>
                                        <span className="text-lg text-gray-900">{(conv as any).wordDetails.kana}</span>
                                    </div>
                                )}
                                {(conv as any).wordDetails.romaji && (
                                    <div className="bg-white/80 rounded-lg px-3 py-2 border border-blue-100">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Romaji</span>
                                        <span className="text-base italic text-gray-900">{(conv as any).wordDetails.romaji}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Meaning & Context Section */}
                    {(conv as any).meaning && (
                        <div className="border-t border-blue-100/50 pt-4 mt-2">
                            <div className="flex items-center gap-2 font-bold text-purple-800 mb-2 text-sm uppercase tracking-wide">
                                💡 Meaning & Context
                            </div>
                            <div className="bg-white/80 rounded-lg px-4 py-3 border border-purple-100 text-gray-800">
                                <div className="font-semibold text-gray-900 mb-1">
                                    {(conv as any).meaning.split('\n')[0]}
                                </div>
                                {(conv as any).meaning.split('\n').length > 1 && (
                                    <div className="text-sm text-gray-600 mt-2 leading-relaxed border-t border-gray-100 pt-2">
                                        {(conv as any).meaning.split('\n').slice(1).join('\n')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* MERGED BOX END */}

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
                        {/* Play Button */}
                        <button
                            onClick={() => playingLine === idx ? stopAudio() : playAudio(stripFurigana(line.japaneseWithFurigana), idx)}
                            className={`p-2.5 rounded-full transition-all shadow-sm ${playingLine === idx
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-2 ring-red-100'
                                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
                                }`}
                            title={playingLine === idx ? "Stop" : "Play Japanese audio"}
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
