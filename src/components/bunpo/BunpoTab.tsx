import { useState, useMemo, useEffect } from 'react';
import { Search, Check, ChevronDown, ChevronUp, Sparkles, Trophy, ChevronDown as ChevronDownIcon } from 'lucide-react';
import grammarPatterns from '../../data/grammar-patterns.json';
import { GrammarPattern, BunpoSubTab } from '../../types';
import { Furigana } from '../common/Furigana';
import { ToggleButton } from '../common/ToggleButton';
import { generateSentenceUpgrade, FREE_GEMINI_MODELS, loadPuterJS } from '../../services/llm';
import { loadConfig } from '../../utils/configManager';

export function BunpoTab() {
  const [activeSubTab, setActiveSubTab] = useState<BunpoSubTab>('library');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [masteredPatterns, setMasteredPatterns] = useState<Set<string>>(new Set());
  const [showEnglish, setShowEnglish] = useState(true);

  // Level Upgrader state
  const [sentence, setSentence] = useState('');
  const [targetLevel, setTargetLevel] = useState<'B1' | 'B2' | 'C1' | 'C2'>('B2');
  const [upgradedSentence, setUpgradedSentence] = useState('');
  const [explanation, setExplanation] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  useEffect(() => {
    // Load Puter.js script when component mounts
    loadPuterJS().catch(console.error);
  }, []);

  // Challenge mode state
  const [challengeScore] = useState(0);
  const [challengeTotal] = useState(0);

  const patterns = grammarPatterns as GrammarPattern[];

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
    setMasteredPatterns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleUpgrade = async () => {
    if (!sentence.trim()) return;
    
    const config = loadConfig();
    const apiKey = config.selectedService === 'gemini' ? config.geminiApiKey :
                   config.selectedService === 'openrouter' ? config.openrouterApiKey :
                   config.selectedService === 'cohere' ? config.cohereApiKey : 'ollama';

    if (!apiKey && config.selectedService !== 'ollama') {
      alert(`Please set your ${config.selectedService} API key in settings`);
      return;
    }

    setUpgrading(true);
    try {
      const result = await generateSentenceUpgrade(sentence, targetLevel, config.selectedService, apiKey, config.ollamaUrl, selectedModel);
      setUpgradedSentence(result.upgraded);
      setExplanation(result.explanation);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upgrade sentence');
    } finally {
      setUpgrading(false);
    }
  };

  const progress = {
    B1: { total: patterns.filter(p => p.cefr === 'B1').length, mastered: patterns.filter(p => p.cefr === 'B1' && masteredPatterns.has(p.id)).length },
    B2: { total: patterns.filter(p => p.cefr === 'B2').length, mastered: patterns.filter(p => p.cefr === 'B2' && masteredPatterns.has(p.id)).length },
    C1: { total: patterns.filter(p => p.cefr === 'C1').length, mastered: patterns.filter(p => p.cefr === 'C1' && masteredPatterns.has(p.id)).length },
    C2: { total: patterns.filter(p => p.cefr === 'C2').length, mastered: patterns.filter(p => p.cefr === 'C2' && masteredPatterns.has(p.id)).length },
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg shadow p-1">
        {(['library', 'upgrader', 'challenge'] as BunpoSubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeSubTab === tab
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'library' && 'Library'}
            {tab === 'upgrader' && 'Upgrader'}
            {tab === 'challenge' && 'Challenge'}
          </button>
        ))}
      </div>

      {/* Library Tab */}
      {activeSubTab === 'library' && (
        <>
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['B1', 'B2', 'C1', 'C2'] as const).map((level) => (
              <div key={level} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">{level} Progress</div>
                <div className="text-2xl font-bold text-gray-800">
                  {progress[level].mastered}/{progress[level].total}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progress[level].total > 0 ? (progress[level].mastered / progress[level].total) * 100 : 0}%` }}
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
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
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

          {/* Pattern Grid */}
          <div className="grid gap-4">
            {filteredPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                  masteredPatterns.has(pattern.id) ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        <Furigana text={pattern.patternWithFurigana} />
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {pattern.cefr}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {pattern.category}
                      </span>
                    </div>
                    {showEnglish && (
                      <p className="text-gray-600 mb-2">{pattern.meaning}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleMastered(pattern.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        masteredPatterns.has(pattern.id)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setExpandedPattern(expandedPattern === pattern.id ? null : pattern.id)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
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
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      {pattern.examples.map((example, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-lg">
                            <Furigana text={example.japaneseWithFurigana} />
                          </div>
                          <div className="text-sm text-gray-500 italic">{example.romaji}</div>
                          {showEnglish && (
                            <div className="text-sm text-gray-600">{example.english}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Sentence
              </label>
              <textarea
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Enter a simple Japanese sentence to upgrade..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as 'B1' | 'B2' | 'C1' | 'C2')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="B1">B1 - Threshold</option>
                <option value="B2">B2 - Vantage</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <div className="relative">
                <button
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between text-left"
                >
                  <span>{FREE_GEMINI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {modelDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {FREE_GEMINI_MODELS.filter(m => m.provider === 'puter').map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500">Free via Puter.js</div>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="px-4 py-2 text-xs text-gray-500 font-medium">API Models (Requires Key)</div>
                      {FREE_GEMINI_MODELS.filter(m => m.provider === 'gemini').map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setModelDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">Requires API key</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Challenge Tab */}
      {activeSubTab === 'challenge' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Grammar Challenge
            </h2>
            <div className="text-lg font-semibold">
              Score: {challengeScore}/{challengeTotal}
            </div>
          </div>

          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Challenge mode coming soon! Test your knowledge with interactive quizzes.
            </p>
            <div className="text-sm text-gray-400">
              You'll be presented with fill-in-the-blank questions using the grammar patterns you've learned.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
