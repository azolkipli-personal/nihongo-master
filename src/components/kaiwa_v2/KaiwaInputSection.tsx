import { useState, useMemo } from 'react';
import { Send, Loader2, Upload, Target, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import grammarPatterns from '../../data/grammar-patterns.json';
import syllabus from '../../data/n3-syllabus.json';
import { GrammarPattern } from '../../types';

interface KaiwaInputSectionProps {
  words: string;
  scenario: string;
  loading: boolean;
  error: string;
  cefrLevel: string;
  focusPatternIds: string[];
  onWordsChange: (value: string) => void;
  onScenarioChange: (value: string) => void;
  onCefrLevelChange: (value: string) => void;
  onFocusPatternIdsChange: (ids: string[]) => void;
  onGenerate: () => void;
  onImportConversations: () => void;
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function getCurrentWeekIndex(): number {
  const startStr = syllabus.startDate || '2026-05-15';
  const start = new Date(startStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(diffWeeks, syllabus.totalWeeks - 1));
}

export function KaiwaInputSection({
  words,
  scenario,
  loading,
  error,
  cefrLevel,
  focusPatternIds,
  onWordsChange,
  onScenarioChange,
  onCefrLevelChange,
  onFocusPatternIdsChange,
  onGenerate,
  onImportConversations,
}: KaiwaInputSectionProps) {
  const [showPatternSelector, setShowPatternSelector] = useState(false);

  const patternsByLevel = useMemo(() => {
    const grouped: Record<string, GrammarPattern[]> = {};
    (grammarPatterns as GrammarPattern[]).forEach((p) => {
      if (!grouped[p.cefr]) grouped[p.cefr] = [];
      grouped[p.cefr].push(p);
    });
    return grouped;
  }, []);

  const togglePattern = (id: string) => {
    if (focusPatternIds.includes(id)) {
      onFocusPatternIdsChange(focusPatternIds.filter((pid) => pid !== id));
    } else {
      onFocusPatternIdsChange([...focusPatternIds, id]);
    }
  };

  const handleThisWeeksPatterns = () => {
    const weekIdx = getCurrentWeekIndex();
    const week = syllabus.weeks[weekIdx];
    if (week && week.patternIds.length > 0) {
      onFocusPatternIdsChange(week.patternIds);
    }
  };

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

        <div className="flex gap-4">
          <div className="flex-[2]">
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">CEFR Level</label>
            <select
              value={cefrLevel}
              onChange={(e) => onCefrLevelChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        </div>

        {/* Focus Grammar Pattern Selector */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowPatternSelector(!showPatternSelector)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
          >
            <Target className="w-4 h-4" />
            🎯 Focus Grammar
            {focusPatternIds.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full">
                {focusPatternIds.length}
              </span>
            )}
            {showPatternSelector ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showPatternSelector && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* This Week&#39;s Patterns button */}
              <button
                onClick={handleThisWeeksPatterns}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm"
              >
                <Calendar className="w-4 h-4" />
                📅 This Week&#39;s Patterns (Week {getCurrentWeekIndex() + 1})
              </button>

              {/* Pattern grid grouped by CEFR level */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {CEFR_ORDER.filter((lvl) => patternsByLevel[lvl]?.length > 0).map((lvl) => (
                  <div key={lvl}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 sticky top-0 bg-gray-50 py-1">
                      {lvl}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {patternsByLevel[lvl].map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => togglePattern(pattern.id)}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            focusPatternIds.includes(pattern.id)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                          title={pattern.meaning}
                        >
                          {pattern.pattern.replace(/〜/g, '～')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {focusPatternIds.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Selected patterns will be used naturally in generated conversations.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

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
              Generate
            </>
          )}
        </button>

        {loading && (
          <div className="text-center text-sm text-blue-600 animate-pulse font-medium">
            Generating learning focus blocks...
          </div>
        )}

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
