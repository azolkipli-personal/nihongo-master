/**
 * syncBackend.ts — Centralized data sync for Nihongo Master.
 *
 * Supports three backends (selectable in Settings):
 *   1. none      — localStorage only (current behavior)
 *   2. nuc       — FastAPI + SQLite backend on the NUC (tailnet / localhost:9001)
 *   3. gdrive    — Google Drive JSON file (planned)
 */

// ── Type for the sync payload ──────────────────────────────────────────────

export interface SyncPayload {
  data: Record<string, unknown>;
  lastUpdated: string | null;
}

// ── SyncBackend interface ──────────────────────────────────────────────────

export interface SyncBackend {
  readonly id: string;
  readonly label: string;
  getProgress(): Promise<SyncPayload>;
  putProgress(payload: SyncPayload, force?: boolean): Promise<{ lastUpdated: string }>;
  getConfig(): Promise<SyncPayload>;
  putConfig(payload: SyncPayload, force?: boolean): Promise<{ lastUpdated: string }>;
}

// ── Backend URL helpers ────────────────────────────────────────────────────

function baseUrl(): string {
  // Configurable via AppConfig (settings UI)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('nihongo-master-config');
    if (stored) {
      try {
        const cfg = JSON.parse(stored);
        if (cfg.syncNucUrl) return cfg.syncNucUrl.replace(/\/+$/, '');
      } catch {
        /* ignore */
      }
    }
  }
  // Use same-origin relative URL — the proxy server handles routing
  return '';
}

// ── NUC Backend (FastAPI + SQLite) ─────────────────────────────────────────

class NucBackend implements SyncBackend {
  readonly id = 'nuc';
  readonly label = 'NUC Server (Local Network)';

  // Resolve URL fresh from config each time so Settings changes take effect immediately
  private get url(): string {
    return baseUrl();
  }

  async getProgress(): Promise<SyncPayload> {
    const res = await fetch(`${this.url}/progress`);
    if (!res.ok) throw new Error(`GET progress failed: ${res.status}`);
    return res.json();
  }

  async putProgress(payload: SyncPayload, force?: boolean): Promise<{ lastUpdated: string }> {
    const url = force ? `${this.url}/progress?force=1` : `${this.url}/progress`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 409) {
      throw new Error('CONFLICT');
    }
    if (!res.ok) throw new Error(`PUT progress failed: ${res.status}`);
    return res.json();
  }

  async getConfig(): Promise<SyncPayload> {
    const res = await fetch(`${this.url}/config`);
    if (!res.ok) throw new Error(`GET config failed: ${res.status}`);
    return res.json();
  }

  async putConfig(payload: SyncPayload, force?: boolean): Promise<{ lastUpdated: string }> {
    const url = force ? `${this.url}/config?force=1` : `${this.url}/config`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 409) {
      throw new Error('CONFLICT');
    }
    if (!res.ok) throw new Error(`PUT config failed: ${res.status}`);
    return res.json();
  }
}

// ── Google Drive Backend (placeholder) ─────────────────────────────────────

class GoogleDriveBackend implements SyncBackend {
  readonly id = 'gdrive';
  readonly label = 'Google Drive (Coming Soon)';

  async getProgress(): Promise<SyncPayload> {
    throw new Error('Google Drive sync is not yet implemented.');
  }

  async putProgress(_payload: SyncPayload): Promise<{ lastUpdated: string }> {
    throw new Error('Google Drive sync is not yet implemented.');
  }

  async getConfig(): Promise<SyncPayload> {
    throw new Error('Google Drive sync is not yet implemented.');
  }

  async putConfig(_payload: SyncPayload): Promise<{ lastUpdated: string }> {
    throw new Error('Google Drive sync is not yet implemented.');
  }
}

// ── No-op backend (localStorage only, no sync) ─────────────────────────────

class NoneBackend implements SyncBackend {
  readonly id = 'none';
  readonly label = 'None (Local Only)';

  async getProgress(): Promise<SyncPayload> {
    return gatherProgress();
  }
  async putProgress(_payload: SyncPayload): Promise<{ lastUpdated: string }> {
    return { lastUpdated: new Date().toISOString() };
  }
  async getConfig(): Promise<SyncPayload> {
    return gatherConfig();
  }
  async putConfig(_payload: SyncPayload): Promise<{ lastUpdated: string }> {
    return { lastUpdated: new Date().toISOString() };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createBackend(type: string): SyncBackend {
  switch (type) {
    case 'nuc':
      return new NucBackend();
    case 'gdrive':
      return new GoogleDriveBackend();
    default:
      return new NoneBackend();
  }
}

export const BACKEND_OPTIONS = [
  { value: 'none', label: 'None (Local Only)' },
  { value: 'nuc', label: 'NUC Server (Local Network)' },
  { value: 'gdrive', label: 'Google Drive (Coming Soon)' },
] as const;

// ── Gather helpers — collect all localStorage state ───────────────────────

export function gatherProgress(): SyncPayload {
  if (typeof window === 'undefined') return { data: {}, lastUpdated: null };

  const data: Record<string, unknown> = {};

  // Grammar SRS data
  const grammar = localStorage.getItem('nihongo-master-grammar-srs');
  if (grammar) data.grammar = JSON.parse(grammar);

  // Grammar mastered list (BunpoTab)
  const grammarMastered = localStorage.getItem('nihongo-master-grammar-mastered');
  if (grammarMastered) data.grammarMastered = JSON.parse(grammarMastered);

  // Vocabulary
  const vocab = localStorage.getItem('nihongo-master-vocabulary');
  if (vocab) data.vocabulary = JSON.parse(vocab);

  // Vocabulary timestamp (TangoTab)
  const vocabTime = localStorage.getItem('nihongo-master-vocabulary-time');
  if (vocabTime) data.vocabularyTime = vocabTime;

  // Sessions
  const sessions = localStorage.getItem('nihongo-master-sessions');
  if (sessions) data.sessions = JSON.parse(sessions);

  // Vocabulary sets
  const vocabSets = localStorage.getItem('nihongo-master-vocab-sets');
  if (vocabSets) data.vocabSets = JSON.parse(vocabSets);

  // Vocab sets editor data (VocabSetsTab)
  const vocabSetsText = localStorage.getItem('vocab-sets-text');
  if (vocabSetsText) data.vocabSetsText = vocabSetsText;
  const vocabSetsParsed = localStorage.getItem('vocab-sets-parsed');
  if (vocabSetsParsed) data.vocabSetsParsed = JSON.parse(vocabSetsParsed);
  const vocabSetsEdits = localStorage.getItem('vocab-sets-edits');
  if (vocabSetsEdits) data.vocabSetsEdits = JSON.parse(vocabSetsEdits);

  // Kaiwa conversations (from kaiwa_v2 STORAGE_KEYS)
  const conversations = localStorage.getItem('kaiwa_conversations');
  if (conversations) data.kaiwaConversations = JSON.parse(conversations);

  // Kaiwa words & scenario
  const words = localStorage.getItem('kaiwa_words');
  if (words) data.kaiwaWords = words;
  const scenario = localStorage.getItem('kaiwa_scenario');
  if (scenario) data.kaiwaScenario = scenario;
  const cefrLevel = localStorage.getItem('kaiwa_cefr_level');
  if (cefrLevel) data.kaiwaCefrLevel = cefrLevel;
  const focusPatterns = localStorage.getItem('kaiwa_focus_pattern_ids');
  if (focusPatterns) data.kaiwaFocusPatterns = JSON.parse(focusPatterns);

  return {
    data,
    lastUpdated: localStorage.getItem('nihongo-master-sync-lastUpdated') || null,
  };
}

export function applyProgress(payload: SyncPayload): void {
  if (typeof window === 'undefined') return;
  const { data, lastUpdated } = payload;
  if (!data) return;

  if (data.grammar)
    localStorage.setItem('nihongo-master-grammar-srs', JSON.stringify(data.grammar));
  if (data.grammarMastered)
    localStorage.setItem('nihongo-master-grammar-mastered', JSON.stringify(data.grammarMastered));
  if (data.vocabulary)
    localStorage.setItem('nihongo-master-vocabulary', JSON.stringify(data.vocabulary));
  if (data.vocabularyTime)
    localStorage.setItem('nihongo-master-vocabulary-time', data.vocabularyTime as string);
  if (data.sessions) localStorage.setItem('nihongo-master-sessions', JSON.stringify(data.sessions));
  if (data.vocabSets)
    localStorage.setItem('nihongo-master-vocab-sets', JSON.stringify(data.vocabSets));
  if (data.vocabSetsText) localStorage.setItem('vocab-sets-text', data.vocabSetsText as string);
  if (data.vocabSetsParsed)
    localStorage.setItem('vocab-sets-parsed', JSON.stringify(data.vocabSetsParsed));
  if (data.vocabSetsEdits)
    localStorage.setItem('vocab-sets-edits', JSON.stringify(data.vocabSetsEdits));
  if (data.kaiwaConversations)
    localStorage.setItem('kaiwa_conversations', JSON.stringify(data.kaiwaConversations));
  if (data.kaiwaWords) localStorage.setItem('kaiwa_words', data.kaiwaWords as string);
  if (data.kaiwaScenario) localStorage.setItem('kaiwa_scenario', data.kaiwaScenario as string);
  if (data.kaiwaCefrLevel) localStorage.setItem('kaiwa_cefr_level', data.kaiwaCefrLevel as string);
  if (data.kaiwaFocusPatterns)
    localStorage.setItem('kaiwa_focus_pattern_ids', JSON.stringify(data.kaiwaFocusPatterns));
  if (lastUpdated) localStorage.setItem('nihongo-master-sync-lastUpdated', lastUpdated);
}

export function gatherConfig(): SyncPayload {
  if (typeof window === 'undefined') return { data: {}, lastUpdated: null };
  const config = localStorage.getItem('nihongo-master-config');
  return {
    data: config ? JSON.parse(config) : {},
    lastUpdated: null,
  };
}
