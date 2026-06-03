import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, BookOpen, Trash2 } from 'lucide-react';
import { loadConfig } from '../../utils/configManager';

// ── Types ──

interface VocabSetEntry {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  context: string;
  source: 'manual' | 'ai-extracted';
  tags: string[];
  notes: string;
  studied: boolean;
  times_used: number; // auto-tracked via KAIWA sends
  times_seen: number;
  date_added: string;
  last_reviewed: string | null;
  contexts: string[];
}

// ── Storage ──

const STORAGE_KEY = 'nihongo-master-vocab-sets';

function loadSets(): VocabSetEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSets(entries: VocabSetEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(
  entry: Omit<
    VocabSetEntry,
    'id' | 'times_seen' | 'times_used' | 'date_added' | 'last_reviewed' | 'contexts'
  >
) {
  const entries = loadSets();
  const existing = entries.find((e) => e.word === entry.word && e.reading === entry.reading);
  if (existing) {
    existing.times_seen++;
    existing.last_reviewed = new Date().toISOString();
    if (entry.context && !existing.contexts.includes(entry.context)) {
      existing.contexts = [entry.context, ...existing.contexts].slice(0, 5);
    }
    if (entry.tags?.length) {
      const merged = new Set([...existing.tags, ...entry.tags]);
      existing.tags = Array.from(merged);
    }
  } else {
    entries.unshift({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      times_seen: 1,
      times_used: 0,
      date_added: new Date().toISOString(),
      last_reviewed: null,
      contexts: entry.context ? [entry.context] : [],
      ...entry,
    });
  }
  saveSets(entries);
  return entries;
}

/** Call when words are sent to KAIWA — auto-increments usage */
function markUsedInKaiwa(words: string[]) {
  const entries = loadSets();
  for (const w of words) {
    const match = entries.find((e) => e.word === w);
    if (match) {
      match.times_used++;
      match.last_reviewed = new Date().toISOString();
    }
  }
  saveSets(entries);
}

// ── Parse helpers ──

function parseNotes(
  text: string
): { word: string; reading: string; meaning: string; context: string }[] {
  const results: { word: string; reading: string; meaning: string; context: string }[] = [];
  const lines = text.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const jpBlocks = line.match(
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]{2,}/g
    );
    if (!jpBlocks) continue;

    for (const jp of jpBlocks) {
      if (jp.length < 2 || (/^[あ-の]+$/.test(jp) && jp.length > 5)) continue;

      let word = jp;
      let reading = '';
      const parenMatch = jp.match(/^([^（(]+)\s*[（(]([^）)]+)[）)]/);
      if (parenMatch) {
        word = parenMatch[1].trim();
        reading = parenMatch[2].trim();
      }

      let meaning = '';
      const meaningMatch = line.match(/[〜〜~\-—–]\s*(.+)/);
      if (meaningMatch) meaning = meaningMatch[1].trim();

      if (!results.some((r) => r.word === word))
        results.push({ word, reading, meaning, context: line.trim() });
    }
  }
  return results;
}

async function aiExtract(
  text: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash'
): Promise<{ word: string; reading: string; meaning: string; context: string }[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a Japanese language expert. The user has pasted notes with Japanese words and their own attempts at readings/meanings.

For each Japanese word or phrase in the text:
1. Extract the correct Japanese word
2. Give the correct hiragana reading
3. Give the correct English meaning
4. Note the context sentence

IMPORTANT: If the user wrote their own reading or meaning that is INCORRECT, provide the CORRECT version. Fix their mistakes.

Return ONLY a JSON array. No markdown, no explanation.

Format: [{"word": "…", "reading": "…", "meaning": "…", "context": "…"}]

Text: """${text}"""`,
              },
            ],
          },
        ],
      }),
    }
  );
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Could not parse AI response');
  return JSON.parse(jsonMatch[0]);
}

// ── Component ──

export function VocabSetsTab() {
  const [entries, setEntries] = useState<VocabSetEntry[]>([]);
  const [activeView, setActiveView] = useState<'capture' | 'browse'>('capture');
  const [search, setSearch] = useState('');
  const [filterStudied, setFilterStudied] = useState<'all' | 'studied' | 'unstudied'>('all');
  const [filterTag, setFilterTag] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEntries(loadSets());
  }, [refreshKey]);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // All unique tags across entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.word.toLowerCase().includes(q) ||
          e.reading.toLowerCase().includes(q) ||
          e.meaning.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterStudied === 'studied') result = result.filter((e) => e.studied);
    if (filterStudied === 'unstudied') result = result.filter((e) => !e.studied);
    if (filterTag !== 'all') result = result.filter((e) => e.tags?.includes(filterTag));
    return result;
  }, [entries, search, filterStudied, filterTag]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">📝 Vocab Sets</h2>
          <span className="text-sm text-gray-500">
            {entries.length} words · {entries.filter((e) => e.studied).length} studied
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Paste notes from your tutor, conversations, or anywhere you picked up new words.
        </p>
      </div>

      <div className="flex gap-2 bg-white rounded-lg shadow p-1">
        {(['capture', 'browse'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeView === v ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {v === 'capture' ? '📥 Capture' : `📖 Browse (${entries.length})`}
          </button>
        ))}
      </div>

      {activeView === 'capture' && <CaptureView onAdd={refresh} />}
      {activeView === 'browse' && (
        <BrowseView
          entries={filtered}
          total={entries.length}
          onUpdate={refresh}
          search={search}
          setSearch={setSearch}
          filterStudied={filterStudied}
          setFilterStudied={setFilterStudied}
          filterTag={filterTag}
          setFilterTag={setFilterTag}
          allTags={allTags}
        />
      )}
    </div>
  );
}

// ── Capture View ──

function CaptureView({ onAdd }: { onAdd: () => void }) {
  const [text, setText] = useState(() => localStorage.getItem('vocab-sets-text') || '');
  const loadParsed = (): { word: string; reading: string; meaning: string; context: string }[] => {
    try {
      return JSON.parse(localStorage.getItem('vocab-sets-parsed') || '[]');
    } catch {
      return [];
    }
  };
  const loadEdits = (): Record<number, { word: string; reading: string; meaning: string }> => {
    try {
      return JSON.parse(localStorage.getItem('vocab-sets-edits') || '{}');
    } catch {
      return {};
    }
  };
  const [parsed, setParsed] = useState(loadParsed);
  const [edits, setEdits] = useState(loadEdits);
  const [aiLoading, setAiLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleTextChange = (val: string) => {
    setText(val);
    localStorage.setItem('vocab-sets-text', val);
    // Clear parsed results when text changes (user is working with new input)
    if (val !== text) {
      setParsed([]);
      setEdits({});
      localStorage.removeItem('vocab-sets-parsed');
      localStorage.removeItem('vocab-sets-edits');
    }
  };
  useEffect(() => {
    localStorage.setItem('vocab-sets-parsed', JSON.stringify(parsed));
  }, [parsed]);
  useEffect(() => {
    localStorage.setItem('vocab-sets-edits', JSON.stringify(edits));
  }, [edits]);

  const handleParse = () => {
    const words = parseNotes(text);
    setParsed(words);
    const e: Record<number, any> = {};
    words.forEach((w, i) => {
      e[i] = { word: w.word, reading: w.reading, meaning: w.meaning };
    });
    setEdits(e);
  };

  const handleAiParse = async () => {
    const config = loadConfig();
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      setStatus('⚠️ Set your Gemini API key in Settings first');
      return;
    }
    setAiLoading(true);
    try {
      const words = await aiExtract(text, apiKey, config.geminiModel);
      setParsed(words);
      const e: Record<number, any> = {};
      words.forEach((w, i) => {
        e[i] = { word: w.word, reading: w.reading, meaning: w.meaning };
      });
      setEdits(e);
      setStatus(`✅ AI extracted ${words.length} words`);
    } catch (err: any) {
      setStatus(`⚠️ AI failed: ${err.message}. Trying basic parse...`);
      handleParse();
    }
    setAiLoading(false);
  };

  const handleEdit = (idx: number, field: string, value: string) =>
    setEdits((prev) => ({ ...prev, [idx]: { ...(prev[idx] || {}), [field]: value } }));

  const handleSave = (idx: number) => {
    const w = parsed[idx];
    const e = edits[idx] || w;
    if (!e.word?.trim()) return;
    addEntry({
      word: e.word.trim(),
      reading: e.reading?.trim() || w.reading,
      meaning: e.meaning?.trim() || w.meaning,
      context: w.context,
      source: 'manual',
      tags: [],
      notes: '',
      studied: false,
    });
    setStatus(`✅ Saved "${e.word.trim()}"`);
    onAdd();
  };

  const handleSaveAll = () => {
    let saved = 0;
    parsed.forEach((w, i) => {
      const e = edits[i] || w;
      if (e.word?.trim()) {
        addEntry({
          word: e.word.trim(),
          reading: e.reading?.trim() || w.reading,
          meaning: e.meaning?.trim() || w.meaning,
          context: w.context,
          source: 'manual',
          tags: [],
          notes: '',
          studied: false,
        });
        saved++;
      }
    });
    setStatus(`✅ Saved ${saved} words.`);
    onAdd();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Paste your Japanese notes here...\n\n例：\n友達が「やばい」って言ってた。やばい = awesome/tough (slang)\n先生が「〜という意味」って説明してくれた。\n勉強(べんきょう) - study"
        className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleParse}
          disabled={!text.trim()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:bg-gray-300"
        >
          🔍 Parse
        </button>
        <button
          onClick={handleAiParse}
          disabled={!text.trim() || aiLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-300"
        >
          {aiLoading ? '⏳ AI parsing...' : '🤖 AI Parse'}
        </button>
      </div>
      {status && <p className="text-sm mb-3 text-gray-600">{status}</p>}

      {parsed.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{parsed.length} words found</span>
            <button
              onClick={handleSaveAll}
              className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
            >
              + Save All
            </button>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {parsed.map((w, i) => {
              const edit = edits[i] || w;
              return (
                <div key={i} className="p-3 hover:bg-gray-50">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <input
                        value={edit.word}
                        onChange={(e) => handleEdit(i, 'word', e.target.value)}
                        className="w-full text-lg font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-purple-500 outline-none"
                        placeholder="Word"
                      />
                      <input
                        value={edit.reading}
                        onChange={(e) => handleEdit(i, 'reading', e.target.value)}
                        className="w-full text-sm text-gray-500 bg-transparent border-b border-dashed border-gray-200 focus:border-purple-500 outline-none"
                        placeholder="Reading (ひらがな)"
                      />
                      <input
                        value={edit.meaning}
                        onChange={(e) => handleEdit(i, 'meaning', e.target.value)}
                        className="w-full text-sm text-gray-600 bg-transparent border-b border-dashed border-gray-200 focus:border-purple-500 outline-none"
                        placeholder="Meaning"
                      />
                      {w.context && (
                        <p className="text-xs text-gray-400 mt-1 italic">「{w.context}」</p>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1 shrink-0">
                      <button
                        onClick={() => handleSave(i)}
                        className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                      >
                        + Save
                      </button>
                      <button
                        onClick={() => setParsed((prev) => prev.filter((_, j) => j !== i))}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Browse View ──

function BrowseView({
  entries,
  total,
  onUpdate,
  search,
  setSearch,
  filterStudied,
  setFilterStudied,
  filterTag,
  setFilterTag,
  allTags,
}: {
  entries: VocabSetEntry[];
  total: number;
  onUpdate: () => void;
  search: string;
  setSearch: (v: string) => void;
  filterStudied: string;
  setFilterStudied: (v: any) => void;
  filterTag: string;
  setFilterTag: (v: string) => void;
  allTags: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sendToKaiwa = () => {
    const selected = entries.filter((e) => selectedIds.has(e.id));
    const words = selected.map((e) => e.word).join(', ');
    if (!words) return;
    markUsedInKaiwa(selected.map((e) => e.word));
    sessionStorage.setItem('kaiwa_practice_words', words);
    window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kaiwa' }));
  };

  const markStudied = (id: string) => {
    const all = loadSets();
    const e = all.find((x) => x.id === id);
    if (e) {
      e.studied = !e.studied;
      e.last_reviewed = new Date().toISOString();
    }
    saveSets(all);
    onUpdate();
  };

  const deleteEntry = (id: string) => {
    saveSets(loadSets().filter((x) => x.id !== id));
    onUpdate();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStudied}
          onChange={(e) => setFilterStudied(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        >
          <option value="all">All ({total})</option>
          <option value="unstudied">Unstudied 🔴</option>
          <option value="studied">Studied ✅</option>
        </select>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <span className="text-sm text-purple-700">{selectedIds.size} selected</span>
          <button
            onClick={sendToKaiwa}
            className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-medium"
          >
            🗣️ Send to KAIWA (auto-track usage)
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{total === 0 ? 'No words yet. Go to Capture tab to add some!' : 'No matches.'}</p>
        </div>
      ) : (
        <div className="divide-y max-h-[500px] overflow-y-auto border rounded-lg">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 hover:bg-gray-50 ${entry.studied ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(entry.id)}
                  className={`mt-1 w-5 h-5 rounded flex items-center justify-center text-xs border ${selectedIds.has(entry.id) ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'}`}
                >
                  {selectedIds.has(entry.id) ? '✓' : ''}
                </button>

                {/* Study toggle */}
                <button
                  onClick={() => markStudied(entry.id)}
                  className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-sm border ${entry.studied ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-400'}`}
                >
                  {entry.studied ? '✓' : '○'}
                </button>

                {/* Word info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-800">{entry.word}</span>
                    {entry.reading && (
                      <span className="text-sm text-gray-500">{entry.reading}</span>
                    )}
                    {entry.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  {entry.meaning && <p className="text-sm text-gray-600">{entry.meaning}</p>}
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span>🔄 {entry.times_used}x used</span>
                    <span>👁️ {entry.times_seen}x seen</span>
                    {entry.last_reviewed && (
                      <span>
                        📅{' '}
                        {Math.floor(
                          (Date.now() - new Date(entry.last_reviewed).getTime()) / 86400000
                        ) === 0
                          ? 'today'
                          : `${Math.floor((Date.now() - new Date(entry.last_reviewed).getTime()) / 86400000)}d ago`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
