import { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, CheckCircle, ExternalLink } from 'lucide-react';
import { syncVocabulary, getReadyForPractice, getPrimaryReading, getPrimaryMeaning } from '../../services/wanikani';
import { loadConfig } from '../../utils/configManager';
import { WaniKaniItem } from '../../types';

export function TangoTab() {
  const [apiKey, setApiKey] = useState('');
  const [vocabulary, setVocabulary] = useState<WaniKaniItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'vocabulary' | 'suggestions'>('sync');

  useEffect(() => {
    const config = loadConfig();
    if (config.wanikaniApiKey) {
      setApiKey(config.wanikaniApiKey);
    }
    
    // Load cached vocabulary from localStorage
    const cached = localStorage.getItem('nihongo-master-vocabulary');
    const cachedTime = localStorage.getItem('nihongo-master-vocabulary-time');
    if (cached) {
      setVocabulary(JSON.parse(cached));
      if (cachedTime) {
        setLastSync(new Date(cachedTime));
      }
    }
  }, []);

  const handleSync = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your WaniKani API key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const items = await syncVocabulary(apiKey);
      setVocabulary(items);
      setLastSync(new Date());
      
      // Cache the results
      localStorage.setItem('nihongo-master-vocabulary', JSON.stringify(items));
      localStorage.setItem('nihongo-master-vocabulary-time', new Date().toISOString());
      
      // Save API key to config
      const config = loadConfig();
      config.wanikaniApiKey = apiKey;
      localStorage.setItem('nihongo-master-config', JSON.stringify(config));
      
      setActiveSubTab('vocabulary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync vocabulary');
    } finally {
      setLoading(false);
    }
  };

  const readyForPractice = getReadyForPractice(vocabulary);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg shadow p-1">
        {(['sync', 'vocabulary', 'suggestions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeSubTab === tab
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'sync' && 'Sync'}
            {tab === 'vocabulary' && `Vocabulary (${vocabulary.length})`}
            {tab === 'suggestions' && `Practice (${readyForPractice.length})`}
          </button>
        ))}
      </div>

      {/* Sync Tab */}
      {activeSubTab === 'sync' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">WaniKani Sync</h2>
            <a
              href="https://www.wanikani.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open WaniKani
            </a>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WaniKani API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your WaniKani API key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can find your API key in your{' '}
                <a 
                  href="https://www.wanikani.com/settings/account" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  WaniKani account settings
                </a>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {lastSync && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                Last synced: {lastSync.toLocaleString()}
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Sync with WaniKani
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Vocabulary Tab */}
      {activeSubTab === 'vocabulary' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Vocabulary ({vocabulary.length} items)
          </h2>

          {vocabulary.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vocabulary synced yet.</p>
              <p className="text-sm">Go to the Sync tab to import your WaniKani vocabulary.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vocabulary.slice(0, 50).map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl text-center mb-2">{item.characters}</div>
                  <div className="text-sm text-gray-600 text-center">
                    {getPrimaryReading(item)}
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {getPrimaryMeaning(item)}
                  </div>
                  <div className="flex justify-center mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      item.srsStage >= 5 ? 'bg-green-100 text-green-700' :
                      item.srsStage >= 1 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      SRS {item.srsStage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {vocabulary.length > 50 && (
            <p className="text-center text-gray-500 mt-4">
              Showing first 50 items. {vocabulary.length - 50} more available.
            </p>
          )}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeSubTab === 'suggestions' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ready for Practice ({readyForPractice.length} items)
          </h2>

          <p className="text-gray-600 mb-4">
            These are vocabulary items from your WaniKani studies that are ready to be used in conversations.
          </p>

          {readyForPractice.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items ready for practice yet.</p>
              <p className="text-sm">Keep studying on WaniKani to unlock more vocabulary!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {readyForPractice.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="border border-blue-200 bg-blue-50 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl text-center mb-2">{item.characters}</div>
                  <div className="text-sm text-gray-600 text-center">
                    {getPrimaryReading(item)}
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {getPrimaryMeaning(item)}
                  </div>
                  <button
                    onClick={() => {
                      // Save word to session storage for KAIWA tab to pick up
                      sessionStorage.setItem('kaiwa_practice_word', item.characters);
                      // Switch to KAIWA tab
                      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kaiwa' }));
                    }}
                    className="w-full mt-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Practice
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
