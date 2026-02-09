import React from 'react';
import { Trash2 } from 'lucide-react';
import { Conversation } from '../../types';
import { Furigana } from '../common/Furigana';

interface ConversationCardProps {
    conversation: Conversation;
    showFurigana: boolean;
    showRomaji: boolean;
    showEnglish: boolean;
    onDelete: (id: string) => void;
}

export function ConversationCard({
    conversation: conv,
    showFurigana,
    showRomaji,
    showEnglish,
    onDelete,
}: ConversationCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-gray-800">{conv.title}</h3>
                <button
                    onClick={() => onDelete(conv.id)}
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
    );
}
