import { VocabSetsTab } from './VocabSetsTab';
import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, BookOpen, ExternalLink, Search, Filter } from 'lucide-react';
import {
  syncVocabulary,
  getReadyForPractice,
  getPrimaryReading,
  getPrimaryMeaning,
} from '../../services/wanikani';
import { loadConfig } from '../../utils/configManager';
import { WaniKaniItem } from '../../types';

export function TangoTab() {
  const [vocabulary, setVocabulary] = useState<WaniKaniItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'sets' | 'vocabulary' | 'sync'>('sets');

  // Vocabulary filtering & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [srsFilter, setSrsFilter] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(50);
  const [sugSelected, setSugSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cached = localStorage.getItem('nihongo-master-vocabulary');
    const cachedTime = localStorage.getItem('nihongo-master-vocabulary-time');
    if (cached) {
      setVocabulary(JSON.parse(cached));
      if (cachedTime) setLastSync(new Date(cachedTime));
    }
  }, []);

  const handleSync = async () => {
    const config = loadConfig();
    const apiKey = config.wanikaniApiKey;
    if (!apiKey || !apiKey.trim()) {
      setError('Please set your WaniKani API key in Settings');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const items = await syncVocabulary(apiKey);
      setVocabulary(items);
      setLastSync(new Date());
      localStorage.setItem('nihongo-master-vocabulary', JSON.stringify(items));
      localStorage.setItem('nihongo-master-vocabulary-time', new Date().toISOString());
      setActiveSubTab('vocabulary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync vocabulary');
    } finally {
      setLoading(false);
    }
  };

  const readyForPractice = useMemo(() => getReadyForPractice(vocabulary), [vocabulary]);

  const filteredVocabulary = useMemo(() => {
    let result = vocabulary;
    if (srsFilter !== 'all') {
      const stage = parseInt(srsFilter, 10);
      if (!isNaN(stage)) result = result.filter(i => i.srsStage === stage);
      else if (srsFilter === 'apprentice') result = result.filter(i => i.srsStage >= 1 && i.srsStage <= 4);
      else if (srsFilter === 'guru') result = result.filter(i => i.srsStage >= 5 && i.srsStage <= 6);
      else if (srsFilter === 'master') result = result.filter(i => i.srsStage === 7);
      else if (srsFilter === 'enlightened') result = result.filter(i => i.srsStage === 8);
      else if (srsFilter === 'burned') result = result.filter(i => i.srsStage === 9);
      else if (srsFilter === 'practice') result = readyForPractice;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => {
        const r = getPrimaryReading(i);
        const m = getPrimaryMeaning(i);
        return i.characters.toLowerCase().includes(q) || (r && r.toLowerCase().includes(q)) || (m && m.toLowerCase().includes(q));
      });
    }
    return result;
  }, [vocabulary, searchQuery, srsFilter, readyForPractice]);

  useEffect(() => { setDisplayCount(50); }, [searchQuery, srsFilter]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg shadow p-1">
        {(['sets', 'vocabulary', 'sync'] as const).map((tab) => (
          <button key={tab} onClick={() => { setActiveSubTab(tab); setSugSelected(new Set()); }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeSubTab === tab ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {tab === 'sets' && '📝 Sets'}
            {tab === 'vocabulary' && `Vocabulary (${vocabulary.length})`}
            {tab === 'sync' && 'Sync'}
          </button>
        ))}
      </div>

      {/* Sets Tab */}
      {activeSubTab === 'sets' && <VocabSetsTab />}

      {/* Vocabulary Tab — merged browse + practice */}
      {activeSubTab === 'vocabulary' && (
        <div className="space-y-6">
          {/* --- All Vocabulary --- */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Your Vocabulary{' '}
                <span className="text-gray-500 font-normal text-lg">
                  ({filteredVocabulary.length} items)
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="relative w-full sm:w-44">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={srsFilter} onChange={e => setSrsFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                    <option value="all">All SRS</option>
                    <option value="practice">🟢 Practice Ready</option>
                    <option value="apprentice">Apprentice (1-4)</option>
                    <option value="guru">Guru (5-6)</option>
                    <option value="master">Master (7)</option>
                    <option value="enlightened">Enlightened (8)</option>
                    <option value="burned">Burned (9)</option>
                  </select>
                </div>
              </div>
            </div>

            {vocabulary.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No vocabulary synced yet.</p>
                <p className="text-sm">Go to the Sync tab to import from WaniKani.</p>
              </div>
            ) : filteredVocabulary.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No matches.</p>
                <button onClick={() => { setSearchQuery(''); setSrsFilter('all'); }}
                  className="text-blue-500 text-sm hover:underline mt-2">Clear filters</button>
              </div>
            ) : (
              <>
                {/* Multi-select send to KAIWA */}
                {sugSelected.size > 0 && (
                  <div className="mb-3 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm text-green-700">{sugSelected.size} words selected</span>
                    <button onClick={() => {
                      const words = vocabulary.filter(i => sugSelected.has(i.id)).map(i => i.characters).join(', ');
                      if (!words) return;
                      sessionStorage.setItem('kaiwa_practice_words', words);
                      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kaiwa' }));
                    }}
                      className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">
                      🗣️ Send {sugSelected.size} to KAIWA
                    </button>
                    <button onClick={() => setSugSelected(new Set())}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredVocabulary.slice(0, displayCount).map(item => (
                    <div key={item.id}
                      className={`border rounded-xl p-4 transition-all flex flex-col items-center cursor-pointer ${
                        sugSelected.has(item.id) ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-gray-50 hover:shadow-md hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSugSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                          return next;
                        });
                      }}
                    >
                      <div className="text-3xl text-gray-800 mb-2">
                        {item.characters}
                        {sugSelected.has(item.id) && <span className="ml-1 text-sm text-green-600">✓</span>}
                      </div>
                      <div className="text-sm font-medium text-gray-600 w-full text-center truncate">{getPrimaryReading(item)}</div>
                      <div className="text-xs text-gray-500 w-full text-center truncate mt-1">{getPrimaryMeaning(item)}</div>
                      <div className="mt-2 flex gap-1">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                          item.srsStage >= 9 ? 'bg-gray-800 text-white' :
                          item.srsStage >= 8 ? 'bg-blue-600 text-white' :
                          item.srsStage >= 7 ? 'bg-blue-500 text-white' :
                          item.srsStage >= 5 ? 'bg-purple-500 text-white' :
                          item.srsStage >= 1 ? 'bg-pink-500 text-white' :
                          'bg-gray-200 text-gray-600'}`}>
                          SRS {item.srsStage}
                        </span>
                      </div>
                      <button onClick={e => {
                        e.stopPropagation();
                        sessionStorage.setItem('kaiwa_practice_word', item.characters);
                        window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kaiwa' }));
                      }}
                        className="w-full mt-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                        Practice
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filteredVocabulary.length > displayCount && (
              <div className="text-center pt-4 border-t border-gray-100 mt-4">
                <p className="text-sm text-gray-500 mb-3">Showing {displayCount} of {filteredVocabulary.length} items</p>
                <button onClick={() => setDisplayCount(prev => prev + 50)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>

      )}

      {/* Sync Tab */}
      {activeSubTab === 'sync' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">WaniKani Sync</h2>
            <a href="https://www.wanikani.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
              <ExternalLink className="w-4 h-4" /> Open WaniKani
            </a>
          </div>

          <div className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            {lastSync && <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">Last synced: {lastSync.toLocaleString()}</div>}

            <button onClick={handleSync} disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Syncing...</> : <><RefreshCw className="w-5 h-5" /> Sync with WaniKani</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
