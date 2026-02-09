import { Send, Loader2, Upload } from 'lucide-react';

interface KaiwaInputSectionProps {
    words: string;
    scenario: string;
    loading: boolean;
    error: string;
    onWordsChange: (value: string) => void;
    onScenarioChange: (value: string) => void;
    onGenerate: () => void;
    onImportConversations: () => void;
}

export function KaiwaInputSection({
    words,
    scenario,
    loading,
    error,
    onWordsChange,
    onScenarioChange,
    onGenerate,
    onImportConversations,
}: KaiwaInputSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Generate Conversation</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vocabulary Words (comma separated)
                    </label>
                    <textarea
                        value={words}
                        onChange={(e) => onWordsChange(e.target.value)}
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
                        onChange={(e) => onScenarioChange(e.target.value)}
                        placeholder="e.g., Code review meeting, Daily standup, Client presentation"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={onGenerate}
                    disabled={loading || !words.trim()}
                    className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Generate Conversation
                        </>
                    )}
                </button>

                {/* Import/Export Section - Always Available */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                        onClick={onImportConversations}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        title="Import conversations from JSON"
                    >
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
}

