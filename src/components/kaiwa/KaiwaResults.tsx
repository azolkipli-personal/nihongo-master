import React from 'react';
import { Conversation } from '../../types';
import { ToggleButton } from '../common/ToggleButton';
import { ExportDropdown } from './ExportDropdown';
import { ConversationCard } from './ConversationCard';

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
    if (conversations.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Results</h2>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <ToggleButton
                            label="Furigana"
                            active={showFurigana}
                            onClick={onToggleFurigana}
                        />
                        <ToggleButton
                            label="Romaji"
                            active={showRomaji}
                            onClick={onToggleRomaji}
                        />
                        <ToggleButton
                            label="English"
                            active={showEnglish}
                            onClick={onToggleEnglish}
                        />
                    </div>
                    <div className="flex gap-2">
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
            </div>

            <div className="space-y-4">
                {conversations.map((conv) => (
                    <ConversationCard
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
    );
}
