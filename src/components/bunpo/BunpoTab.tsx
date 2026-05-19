import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Clock,
  Calendar,
} from 'lucide-react';
import grammarPatterns from '../../data/grammar-patterns.json';
import syllabus from '../../data/n3-syllabus.json';
import { GrammarPattern, BunpoSubTab } from '../../types';
import { Furigana } from '../common/Furigana';
import { ToggleButton } from '../common/ToggleButton';
import { generateSentenceUpgrade } from '../../services/llm';
import { loadConfig } from '../../utils/configManager';
import { isDueForReview, calculateNextReview } from '../../services/srsService';

type ChallengeQuestion = {
  patternId: string;
  sentence: string;
  originalSentence: string;
  english: string;
  correctAnswer: string;
  options: string[];
  meaning: string;
};

export function BunpoTab() {
  const [activeSubTab, setActiveSubTab] = useState<BunpoSubTab | 'review'>('path');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'level' | 'hub'>('level');
  const [challengeLevel] = useState<string>('all');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // SRS state
  const [grammarData, setGrammarData] = useState<Record<string, Partial<GrammarPattern>>>(() => {
    const saved = localStorage.getItem('nihongo-master-grammar-srs');
    if (saved) return JSON.parse(saved);

    // Fallback/Migration: convert old mastered list to SRS stage 8
    const oldMastered = localStorage.getItem('nihongo-master-grammar-mastered');
    if (oldMastered) {
      const ids = JSON.parse(oldMastered) as string[];
      const initial: Record<string, Partial<GrammarPattern>> = {};
      ids.forEach((id) => {
        initial[id] = { mastered: true, srsStage: 8 };
      });
      return initial;
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('nihongo-master-grammar-srs', JSON.stringify(grammarData));
  }, [grammarData]);

  const [showEnglish, setShowEnglish] = useState(true);

  // Level Upgrader state
  const [sentence, setSentence] = useState('');
  const [targetLevel, setTargetLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B2');
  const [upgradedSentence, setUpgradedSentence] = useState('');
  const [explanation, setExplanation] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    // Component initialization
  }, []);

  // Challenge mode state is now handled inside the ChallengeMode component

  // Week-aware quiz state
  const [quizWeekPatternIds, setQuizWeekPatternIds] = useState<string[] | null>(null);
  const [quizWeekLabel, setQuizWeekLabel] = useState<string | null>(null);

  const handleQuizWeek = (patternIds: string[], label: string) => {
    setQuizWeekPatternIds(patternIds);
    setQuizWeekLabel(label);
    setActiveSubTab('challenge');
  };

  const patterns = useMemo(() => {
    return (grammarPatterns as GrammarPattern[]).map((p) => ({
      ...p,
      ...grammarData[p.id],
    }));
  }, [grammarData]);

  const filteredPatterns = useMemo(() => {
    return patterns.filter((p) => {
      const matchesLevel = selectedLevel === 'all' || p.cefr === selectedLevel;
      const matchesSearch =
        p.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reading.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [patterns, selectedLevel, searchQuery]);

  const toggleMastered = (id: string) => {
    setGrammarData((prev) => {
      const current = prev[id] || {};
      const isMastered = !current.mastered;
      if (isMastered) {
        // Burning: mark as mastered, no further review needed
        return {
          ...prev,
          [id]: { ...current, mastered: true, srsStage: 8, nextReviewDate: undefined },
        };
      }
      // Un-mastering: put into SRS rotation starting from stage 0
      const srsUpdate = calculateNextReview(0, false);
      return {
        ...prev,
        [id]: {
          ...current,
          ...srsUpdate,
          mastered: false,
        },
      };
    });
  };

  const handleSrsUpdate = (id: string, isCorrect: boolean) => {
    setGrammarData((prev) => {
      const current = prev[id] || { srsStage: 0 };
      const update = calculateNextReview(current.srsStage || 0, isCorrect);
      return {
        ...prev,
        [id]: {
          ...current,
          ...update,
          mastered: update.srsStage === 8,
        },
      };
    });
  };

  // Patterns that have never been reviewed (no SRS data, not mastered)
  const unreviewedPatterns = useMemo(() => {
    return patterns.filter((p) => !p.mastered && p.srsStage === undefined);
  }, [patterns]);

  const startReviewingNew = (ids: string[]) => {
    setGrammarData((prev) => {
      const updated = { ...prev };
      ids.forEach((id) => {
        if (!updated[id]) {
          updated[id] = { mastered: false, srsStage: 0, nextReviewDate: new Date().toISOString() };
        }
      });
      return updated;
    });
  };

  const handleUpgrade = async () => {
    if (!sentence.trim()) return;

    const config = loadConfig();
    const apiKey =
      config.selectedService === 'gemini'
        ? config.geminiApiKey
        : config.selectedService === 'openrouter'
          ? config.openrouterApiKey
          : 'ollama';

    if (!apiKey && config.selectedService !== 'ollama') {
      alert(`Please set your ${config.selectedService} API key in settings`);
      return;
    }

    setUpgrading(true);
    try {
      const model = config.selectedService === 'gemini' ? config.geminiModel : config.ollamaModel;
      const result = await generateSentenceUpgrade(
        sentence,
        targetLevel,
        config.selectedService,
        apiKey,
        config.ollamaUrl,
        model
      );
      setUpgradedSentence(result.upgraded);
      setExplanation(result.explanation);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upgrade sentence');
    } finally {
      setUpgrading(false);
    }
  };

  const progress = {
    A1: {
      total: patterns.filter((p) => p.cefr === 'A1').length,
      mastered: patterns.filter((p) => p.cefr === 'A1' && p.mastered).length,
    },
    A2: {
      total: patterns.filter((p) => p.cefr === 'A2').length,
      mastered: patterns.filter((p) => p.cefr === 'A2' && p.mastered).length,
    },
    B1: {
      total: patterns.filter((p) => p.cefr === 'B1').length,
      mastered: patterns.filter((p) => p.cefr === 'B1' && p.mastered).length,
    },
    B2: {
      total: patterns.filter((p) => p.cefr === 'B2').length,
      mastered: patterns.filter((p) => p.cefr === 'B2' && p.mastered).length,
    },
    C1: {
      total: patterns.filter((p) => p.cefr === 'C1').length,
      mastered: patterns.filter((p) => p.cefr === 'C1' && p.mastered).length,
    },
    C2: {
      total: patterns.filter((p) => p.cefr === 'C2').length,
      mastered: patterns.filter((p) => p.cefr === 'C2' && p.mastered).length,
    },
  };

  const libraryGroups = useMemo(() => {
    const groups: Record<string, GrammarPattern[]> = {};
    filteredPatterns.forEach((p) => {
      const key = groupBy === 'level' ? p.cefr : p.hub || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredPatterns, groupBy]);

  const renderExplanation = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('> [!NOTE]'))
        return (
          <div
            key={i}
            className="bg-blue-50 text-blue-800 p-3 rounded my-2 font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Note:
          </div>
        );
      if (line.startsWith('> [!IMPORTANT]'))
        return (
          <div
            key={i}
            className="bg-yellow-50 text-yellow-800 p-3 rounded my-2 font-bold flex items-center gap-2"
          >
            Important:
          </div>
        );
      if (line.startsWith('> '))
        return (
          <div key={i} className="bg-gray-50 border-l-4 border-gray-300 p-2 my-1 text-gray-700">
            {line.slice(2)}
          </div>
        );
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return (
        <p key={i} className="my-1 text-gray-700">
          {line.replace(/\\`([^\\`]+)\\`/g, '$1')}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg shadow p-1 overflow-x-auto">
        {(['path', 'review', 'library', 'upgrader', 'challenge'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 min-w-[100px] py-2 px-4 rounded-md font-medium transition-colors ${
              activeSubTab === tab ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'path' && 'N3 Track'}
            {tab === 'review' && 'Reviews'}
            {tab === 'library' && 'Library'}
            {tab === 'upgrader' && 'Upgrader'}
            {tab === 'challenge' && 'Challenge'}
          </button>
        ))}
      </div>

      {/* Reviews Tab */}
      {activeSubTab === 'review' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" />
              SRS Reviews
            </h2>
            <div className="text-sm text-gray-500">
              Due Now: {patterns.filter((p) => isDueForReview(p.nextReviewDate)).length}
            </div>
          </div>

          <ChallengeMode
            patterns={patterns.filter((p) => isDueForReview(p.nextReviewDate))}
            masteredPatternIds={new Set(patterns.filter((p) => p.mastered).map((p) => p.id))}
            challengeLevel="all"
            onSrsUpdate={handleSrsUpdate}
          />

          {patterns.filter((p) => isDueForReview(p.nextReviewDate)).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">No reviews due right now!</p>
              <p className="text-sm">Come back later or explore the Library.</p>
            </div>
          )}

          {/* New Patterns — never reviewed, ready to start */}
          {unreviewedPatterns.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-2xl">🆕</span>
                  New Patterns
                </h3>
                <span className="text-sm text-blue-600 font-medium">
                  {unreviewedPatterns.length} ready to start
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {unreviewedPatterns.slice(0, 12).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <span className="text-lg font-bold text-blue-700">{p.pattern}</span>
                    <span className="text-xs text-gray-600">{p.meaning}</span>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {p.cefr}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => startReviewingNew(unreviewedPatterns.map((p) => p.id))}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Reviewing New Patterns
              </button>
            </div>
          )}
        </div>
      )}

      {/* Library Tab */}
      {activeSubTab === 'library' && (
        <>
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((level) => (
              <div key={level} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">{level}</div>
                <div className="text-xl font-bold text-gray-800">
                  {progress[level].mastered}/{progress[level].total}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${progress[level].total > 0 ? (progress[level].mastered / progress[level].total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patterns or meanings..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'level' | 'hub')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="level">Group by Level</option>
                  <option value="hub">Group by Hub</option>
                </select>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
                <ToggleButton
                  label="English"
                  active={showEnglish}
                  onClick={() => setShowEnglish(!showEnglish)}
                />
              </div>
            </div>
          </div>

          {/* Pattern Grid by Groups */}
          <div className="space-y-6">
            {Object.entries(libraryGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([groupName, groupPatterns]) => (
                <div key={groupName} className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
                    {groupName === 'Other' ? 'Miscellaneous' : groupName}
                  </h3>
                  <div className="grid gap-4">
                    {groupPatterns.map((pattern) => (
                      <div
                        key={pattern.id}
                        className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                          pattern.mastered ? 'border-green-500' : 'border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-2xl">
                                <Furigana text={pattern.patternWithFurigana} />
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {pattern.cefr}
                              </span>
                              {pattern.srsStage !== undefined && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                                  Stage {pattern.srsStage}
                                </span>
                              )}
                              {groupBy === 'level' && pattern.hub && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {pattern.hub}
                                </span>
                              )}
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {pattern.category}
                              </span>
                            </div>
                            {showEnglish && <p className="text-gray-600 mb-2">{pattern.meaning}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleMastered(pattern.id)}
                              aria-label={
                                pattern.mastered ? 'Mark as unmastered' : 'Mark as mastered'
                              }
                              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                                pattern.mastered
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                setExpandedPattern(
                                  expandedPattern === pattern.id ? null : pattern.id
                                )
                              }
                              aria-label={
                                expandedPattern === pattern.id ? 'Show less' : 'Show more'
                              }
                              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
                            >
                              {expandedPattern === pattern.id ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {expandedPattern === pattern.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                            {pattern.detailedExplanation && (
                              <div className="mb-4 text-sm leading-relaxed overflow-hidden">
                                {renderExplanation(pattern.detailedExplanation)}
                              </div>
                            )}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase">
                                Examples
                              </h4>
                              {pattern.examples.map((example, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                                >
                                  <div className="text-lg text-gray-800">
                                    <Furigana text={example.japaneseWithFurigana} />
                                  </div>
                                  <div className="text-sm text-gray-400 italic mt-1">
                                    {example.romaji}
                                  </div>
                                  {showEnglish && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      {example.english}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {Object.keys(libraryGroups).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No patterns found matching your search.
              </div>
            )}
          </div>
        </>
      )}

      {/* Upgrader Tab */}
      {activeSubTab === 'upgrader' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Sentence Upgrader
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Sentence</label>
              <textarea
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Enter a simple Japanese sentence to upgrade..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">CEFR Target Level</label>
                <div className="group relative">
                  <div className="cursor-help text-gray-400 hover:text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    Adjusts the complexity of the upgraded sentence to match the specified European
                    framework level.
                  </div>
                </div>
              </div>
              <select
                value={targetLevel}
                onChange={(e) =>
                  setTargetLevel(e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Threshold</option>
                <option value="B2">B2 - Vantage</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgrading || !sentence.trim()}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Upgrade Sentence
                </>
              )}
            </button>

            {upgradedSentence && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Upgraded Version:</h3>
                <div className="text-xl text-gray-800 mb-2">
                  <Furigana text={upgradedSentence} />
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Explanation:</span> {explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* N3 Track Tab (replaces Learning Path) */}
      {activeSubTab === 'path' && (
        <N3Track
          patterns={patterns}
          toggleMastered={toggleMastered}
          setActiveSubTab={setActiveSubTab}
          onQuizWeek={handleQuizWeek}
        />
      )}

      {/* Challenge Tab */}
      {activeSubTab === 'challenge' && (
        <div className="bg-white rounded-lg shadow p-6">
          {quizWeekLabel && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-800 font-semibold">📝 {quizWeekLabel}</span>
              <span className="text-blue-600 text-sm ml-2">
                {quizWeekPatternIds?.length || 0} patterns
              </span>
            </div>
          )}
          <ChallengeMode
            patterns={patterns}
            masteredPatternIds={new Set(patterns.filter((p) => p.mastered).map((p) => p.id))}
            challengeLevel={challengeLevel}
            onSrsUpdate={handleSrsUpdate}
            weekPatternIds={quizWeekPatternIds}
            weekLabel={quizWeekLabel}
          />
        </div>
      )}
    </div>
  );
}

// --- N3 Track Component ---
function N3Track({
  patterns,
  toggleMastered,
  setActiveSubTab,
  onQuizWeek,
}: {
  patterns: GrammarPattern[];
  toggleMastered: (id: string) => void;
  setActiveSubTab: (tab: BunpoSubTab | 'review') => void;
  onQuizWeek: (patternIds: string[], label: string) => void;
}) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Calculate current week from syllabus start date
  const currentWeekIndex = useMemo(() => {
    const startStr = syllabus.startDate || '2026-05-15';
    const start = new Date(startStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(diffWeeks, syllabus.totalWeeks - 1));
  }, []);

  // Build a lookup map from pattern IDs to pattern objects
  const patternMap = useMemo(() => {
    const map = new Map<string, GrammarPattern>();
    patterns.forEach((p) => map.set(p.id, p));
    return map;
  }, [patterns]);

  // Get patterns for a specific week
  const getWeekPatterns = (patternIds: string[]) => {
    return patternIds
      .map((id) => patternMap.get(id))
      .filter((p): p is GrammarPattern => p !== undefined);
  };

  // Count mastered patterns in a week
  const getMasteredCount = (patternIds: string[]) => {
    let count = 0;
    patternIds.forEach((id) => {
      const p = patternMap.get(id);
      if (p && p.mastered) count++;
    });
    return count;
  };

  // --- Computed values for catch-up & progress ---
  const dueCount = useMemo(() => {
    return patterns.filter((p) => isDueForReview(p.nextReviewDate)).length;
  }, [patterns]);

  const [showCatchUp, setShowCatchUp] = useState(false);

  // Overall progress across all syllabus patterns
  const { totalSyllabusPatterns, masteredSyllabusPatterns, progressPct } = useMemo(() => {
    const allIds = new Set<string>();
    syllabus.weeks.forEach((w) => w.patternIds.forEach((id) => allIds.add(id)));
    let mastered = 0;
    allIds.forEach((id) => {
      const p = patternMap.get(id);
      if (p && p.mastered) mastered++;
    });
    const total = allIds.size;
    return {
      totalSyllabusPatterns: total,
      masteredSyllabusPatterns: mastered,
      progressPct: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  }, [patternMap]);

  // Past weeks catch-up: patterns from weeks before current that aren't mastered
  const pastWeeksUnmastered = useMemo(() => {
    const result: { week: number; weekTitle: string; patterns: GrammarPattern[] }[] = [];
    for (let i = 0; i < currentWeekIndex; i++) {
      const week = syllabus.weeks[i];
      if (!week || week.isReview) continue;
      const unmastered = week.patternIds
        .map((id) => patternMap.get(id))
        .filter((p): p is GrammarPattern => p !== undefined && !p.mastered);
      if (unmastered.length > 0) {
        result.push({ week: week.week, weekTitle: week.title, patterns: unmastered });
      }
    }
    return result;
  }, [currentWeekIndex, patternMap]);

  // Total unmastered from past weeks
  const pastWeeksUnmasteredCount = useMemo(() => {
    return pastWeeksUnmastered.reduce((sum, w) => sum + w.patterns.length, 0);
  }, [pastWeeksUnmastered]);

  const handlePracticeThisWeek = () => {
    const week = syllabus.weeks[currentWeekIndex];
    if (week && week.patternIds.length > 0) {
      sessionStorage.setItem('kaiwa_practice_patterns', JSON.stringify(week.patternIds));
      alert(
        `Go to Kaiwa tab and click 'This Week's Patterns' to practice Week ${currentWeekIndex + 1} patterns!`
      );
    }
  };

  // Week status helper
  const getWeekStatus = (idx: number, patternIds: string[]) => {
    if (idx === currentWeekIndex) return { label: '🟢 Active', color: '' };
    if (idx > currentWeekIndex) return null; // future
    const mastered = getMasteredCount(patternIds);
    if (mastered === patternIds.length && patternIds.length > 0)
      return { label: '✅ Done', color: '' };
    if (patternIds.length > 0)
      return { label: `⚠️ ${patternIds.length - mastered} remaining`, color: '' };
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">N3 Grammar Track</h2>
        <p className="text-gray-600">
          20-week structured syllabus — follow along with N3 grammar patterns.
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-800">
            {masteredSyllabusPatterns} / {totalSyllabusPatterns} patterns mastered ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progressPct > 80 ? 'bg-green-500' : progressPct > 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Catch-up & Review Summary */}
      <div className="mb-4 space-y-2">
        {/* Overdue SRS Review Badge */}
        {dueCount > 0 && (
          <button
            onClick={() => setActiveSubTab('review')}
            className="w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left flex items-center gap-3"
          >
            <span className="text-lg">🔴</span>
            <span className="font-semibold text-red-800">{dueCount} due for review</span>
            <span className="text-red-500 text-sm ml-auto">Go to Reviews →</span>
          </button>
        )}

        {/* Past Weeks Catch-up */}
        {pastWeeksUnmasteredCount > 0 && (
          <div>
            <button
              onClick={() => setShowCatchUp(!showCatchUp)}
              className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-left flex items-center gap-3"
            >
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-amber-800">
                {pastWeeksUnmasteredCount} patterns from past weeks not yet mastered
              </span>
              <span className="text-amber-500 ml-auto">
                {showCatchUp ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </span>
            </button>
            {showCatchUp && (
              <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                {pastWeeksUnmastered.map((pw) => (
                  <div key={pw.week} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-sm font-semibold text-gray-600 mb-2">
                      Week {pw.week}: {pw.weekTitle}
                    </div>
                    <div className="space-y-1">
                      {pw.patterns.map((pattern) => (
                        <div
                          key={pattern.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-800">
                              <Furigana text={pattern.patternWithFurigana} />
                            </span>
                            <span className="text-xs text-gray-500 ml-2">{pattern.meaning}</span>
                          </div>
                          <button
                            onClick={() => toggleMastered(pattern.id)}
                            aria-label="Mark as mastered"
                            className="p-1.5 rounded-lg bg-gray-200 text-gray-400 hover:bg-green-500 hover:text-white transition-colors flex-shrink-0 ml-2"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Practice this Week button */}
      <button
        onClick={handlePracticeThisWeek}
        className="w-full mb-3 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
      >
        <Calendar className="w-5 h-5" />
        Practice this Week → (Week {currentWeekIndex + 1})
      </button>

      {/* Quiz This Week button */}
      {(() => {
        const currentWeek = syllabus.weeks[currentWeekIndex];
        if (currentWeek && !currentWeek.isReview && currentWeek.patternIds.length > 0) {
          return (
            <button
              onClick={() =>
                onQuizWeek(
                  currentWeek.patternIds,
                  `Week ${currentWeek.week} Quiz (${currentWeek.start} – ${currentWeek.end})`
                )
              }
              className="w-full mb-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              Start Weekly Quiz (Week {currentWeek.week})
            </button>
          );
        }
        return null;
      })()}

      {/* Week cards */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {syllabus.weeks.map((week, idx) => {
          const isCurrent = idx === currentWeekIndex;
          const isExpanded = expandedWeek === idx;
          const masteredCount = getMasteredCount(week.patternIds);
          const totalPatterns = week.patternIds.length;
          const weekPatterns = getWeekPatterns(week.patternIds);

          return (
            <div
              key={week.week}
              className={`rounded-lg border-2 transition-colors ${
                isCurrent
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                      isCurrent
                        ? 'bg-blue-500 text-white'
                        : week.isReview
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {week.week}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {week.title}
                      {isCurrent && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          Current
                        </span>
                      )}
                      {week.isReview && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Review
                        </span>
                      )}
                      {/* Week status badge */}
                      {(() => {
                        const status = getWeekStatus(idx, week.patternIds);
                        if (!status) return null;
                        return <span className="ml-2 text-xs">{status.label}</span>;
                      })()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {week.start} – {week.end}
                      {totalPatterns > 0 && (
                        <span className="ml-2">
                          {masteredCount}/{totalPatterns} mastered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {totalPatterns > 0 && (
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(masteredCount / totalPatterns) * 100}%` }}
                      />
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded pattern list */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  {week.isReview ? (
                    <div className="py-4 text-center text-gray-500">
                      <p className="font-medium">Review Week</p>
                      <p className="text-sm mt-1">
                        Review all patterns from Weeks 1–15 using the Library or Challenge mode.
                      </p>
                    </div>
                  ) : weekPatterns.length > 0 ? (
                    <div className="space-y-3 pt-4">
                      {weekPatterns.map((pattern) => (
                        <div
                          key={pattern.id}
                          className={`p-3 rounded-lg border ${
                            pattern.mastered
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-lg font-medium text-gray-800">
                                  <Furigana text={pattern.patternWithFurigana} />
                                </span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  {pattern.cefr}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{pattern.meaning}</p>

                              {/* First example with furigana */}
                              {pattern.examples.length > 0 && (
                                <div className="bg-white p-2 rounded border border-gray-100">
                                  <div className="text-sm text-gray-800">
                                    <Furigana text={pattern.examples[0].japaneseWithFurigana} />
                                  </div>
                                  <div className="text-xs text-gray-400 italic mt-0.5">
                                    {pattern.examples[0].romaji}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {pattern.examples[0].english}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Mastered checkbox */}
                            <button
                              onClick={() => toggleMastered(pattern.id)}
                              aria-label={
                                pattern.mastered ? 'Mark as unmastered' : 'Mark as mastered'
                              }
                              className={`p-2 rounded-lg transition-colors flex-shrink-0 ml-3 ${
                                pattern.mastered
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              }`}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Re-quiz button for past weeks */}
                      {!isCurrent && (
                        <button
                          onClick={() =>
                            onQuizWeek(
                              week.patternIds,
                              `Week ${week.week} Re-quiz (${week.start} – ${week.end})`
                            )
                          }
                          className="w-full mt-2 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Trophy className="w-4 h-4" />
                          Re-quiz Week {week.week}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      <p>No patterns assigned this week.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Challenge Mode Implementation ---
function ChallengeMode({
  patterns,
  masteredPatternIds,
  challengeLevel,
  onSrsUpdate,
  weekPatternIds,
  weekLabel,
}: {
  patterns: GrammarPattern[];
  masteredPatternIds: Set<string>;
  challengeLevel: string;
  onSrsUpdate?: (id: string, isCorrect: boolean) => void;
  weekPatternIds?: string[] | null;
  weekLabel?: string | null;
}) {
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Build lookup for week patterns
  const weekPatternSet = useMemo(
    () => (weekPatternIds ? new Set(weekPatternIds) : null),
    [weekPatternIds]
  );

  // Initialize quiz
  const startQuiz = useCallback(() => {
    let pool: GrammarPattern[];

    if (weekPatternSet) {
      // Week-aware mode: pool = this week's patterns
      pool = weekPatternIds!
        .map((id) => patterns.find((p) => p.id === id))
        .filter((p): p is GrammarPattern => p !== undefined && p.examples.length > 0);

      // Sort: unmastered first, then by lower SRS stage
      pool.sort((a, b) => {
        const aMastered = masteredPatternIds.has(a.id) ? 1 : 0;
        const bMastered = masteredPatternIds.has(b.id) ? 1 : 0;
        if (aMastered !== bMastered) return aMastered - bMastered;
        const aStage = (a as any).srsStage || 0;
        const bStage = (b as any).srsStage || 0;
        return aStage - bStage;
      });
    } else {
      // Classic mode: pick from mastered patterns by level
      pool = patterns.filter(
        (p) =>
          masteredPatternIds.has(p.id) &&
          p.examples.length > 0 &&
          (challengeLevel === 'all' || p.cefr === challengeLevel)
      );
      if (pool.length < 5) {
        pool = patterns.filter(
          (p) => p.examples.length > 0 && (challengeLevel === 'all' || p.cefr === challengeLevel)
        );
      }
    }

    // Sort randomly (shuffle the ordered pool)
    pool.sort(() => Math.random() - 0.5);
    const selectedPatterns = pool.slice(0, Math.min(5, pool.length)); // up to 5 questions per quiz

    const newQuestions = selectedPatterns.map((pattern) => {
      // Create fill-in-the-blank from first example
      const example = pattern.examples[0];
      const sentence = example.japanese;
      // Heuristic: strip the exact pattern text (kanji or hiragana) to make the blank
      // Since pattern.pattern often has '～' we strip it
      const rawPattern = pattern.pattern.replace(/～/g, '');
      const rawReading = pattern.reading.replace(/～/g, '');

      let blankedSentence = sentence.replace(rawPattern, '____');
      if (blankedSentence === sentence) {
        blankedSentence = sentence.replace(rawReading, '____');
      }

      // Generate distractors (3 wrong answers from same CEFR level)
      const distractors = patterns
        .filter((p) => p.id !== pattern.id && p.cefr === pattern.cefr)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((p) => p.pattern.replace(/～/g, ''));

      const options = [rawPattern, ...distractors].sort(() => Math.random() - 0.5);

      return {
        patternId: pattern.id,
        sentence:
          blankedSentence !== sentence ? blankedSentence : sentence.replace(/.{2,4}$/, '____'), // Fallback blank
        originalSentence: sentence,
        english: example.english,
        correctAnswer: rawPattern,
        options,
        meaning: pattern.meaning,
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsFinished(false);
  }, [patterns, masteredPatternIds, challengeLevel, weekPatternIds, weekPatternSet]);

  // Start on mount or when level changes
  useEffect(() => {
    startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeLevel]);

  if (questions.length === 0) return <div>Loading challenge...</div>;

  if (isFinished) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Challenge Complete!</h3>
        {weekLabel && <p className="text-sm text-blue-600 font-medium mb-2">{weekLabel}</p>}
        <p className="text-xl text-gray-600 mb-8">
          You scored {score} out of {questions.length}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            {weekLabel ? 'Retry Quiz' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleAnswer = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    setSelectedAnswer(option);
    const isCorrect = option === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
    if (onSrsUpdate) {
      onSrsUpdate(currentQ.patternId, isCorrect);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6 text-sm font-medium text-gray-500">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span>Score: {score}</span>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8 shadow-sm">
        <h3 className="text-xl font-medium text-gray-800 mb-2 leading-relaxed">
          {currentQ.sentence}
        </h3>
        <p className="text-gray-500 text-sm">{currentQ.english}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.options.map((option: string, idx: number) => {
          let stateStyles =
            'bg-white border-gray-200 text-gray-700 hover:border-blue-500 hover:bg-blue-50';
          if (selectedAnswer !== null) {
            if (option === currentQ.correctAnswer) {
              stateStyles = 'bg-green-100 border-green-500 text-green-800 font-bold';
            } else if (option === selectedAnswer) {
              stateStyles = 'bg-red-100 border-red-500 text-red-800';
            } else {
              stateStyles = 'bg-gray-50 border-gray-200 text-gray-400 opacity-50';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`p-4 border-2 rounded-xl text-center text-lg transition-all ${stateStyles}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              Grammar Pattern:
            </div>
            <div className="text-gray-800 font-medium">
              ～{currentQ.correctAnswer}{' '}
              <span className="text-gray-500 font-normal">({currentQ.meaning})</span>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-8 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
