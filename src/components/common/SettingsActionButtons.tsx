import React from 'react';
import { Check } from 'lucide-react';

interface SettingsActionButtonsProps {
    saved: boolean;
    onSave: () => void;
    onImport: () => void;
    onExport: () => void;
}

export function SettingsActionButtons({
    saved,
    onSave,
    onImport,
    onExport,
}: SettingsActionButtonsProps) {
    return (
        <div className="mt-12 space-y-3">
            <button
                onClick={onSave}
                className={`w-full py-3.5 rounded-md font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${saved ? 'bg-green-500' : 'bg-[#7C89FF] hover:bg-[#6B79F0]'
                    }`}
            >
                {saved ? <><Check className="w-5 h-5" /> Saved!</> : 'Save and Close'}
            </button>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onImport}
                    className="py-2.5 bg-[#2A344D] hover:bg-[#35415E] rounded-md text-xs font-medium text-gray-300 transition-all border border-[#3E4A6D]"
                >
                    Import Settings
                </button>
                <button
                    onClick={onExport}
                    className="py-2.5 bg-[#2A344D] hover:bg-[#35415E] rounded-md text-xs font-medium text-gray-300 transition-all border border-[#3E4A6D]"
                >
                    Export Settings
                </button>
            </div>
        </div>
    );
}
