import React from 'react';
import { Download, ChevronDown, FileText } from 'lucide-react';

interface ExportDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onExport: (format: 'json' | 'csv' | 'anki') => void;
}

export function ExportDropdown({ isOpen, onToggle, onExport }: ExportDropdownProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                title="Export conversations"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg min-w-48">
                    <button
                        onClick={() => onExport('json')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                            <div className="font-medium">JSON</div>
                            <div className="text-xs text-gray-500">Full data with metadata</div>
                        </div>
                    </button>
                    <button
                        onClick={() => onExport('csv')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4 text-green-600" />
                        <div>
                            <div className="font-medium">CSV</div>
                            <div className="text-xs text-gray-500">Spreadsheet format</div>
                        </div>
                    </button>
                    <button
                        onClick={() => onExport('anki')}
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
    );
}
