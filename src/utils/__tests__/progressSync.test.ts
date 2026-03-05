import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportProgress, importProgress } from '../progressSync';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('progressSync utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('exportProgress', () => {
    it('returns a valid JSON string', () => {
      expect(() => JSON.parse(exportProgress())).not.toThrow();
    });

    it('includes grammar, vocabulary, sessions, and lastUpdated fields', () => {
      const data = JSON.parse(exportProgress());
      expect(data).toHaveProperty('grammar');
      expect(data).toHaveProperty('vocabulary');
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('lastUpdated');
    });

    it('exports stored grammar SRS data', () => {
      const grammarData = { 'g-b1-01': { srsStage: 3 } };
      localStorageMock.setItem('nihongo-master-grammar-srs', JSON.stringify(grammarData));
      const data = JSON.parse(exportProgress());
      expect(data.grammar['g-b1-01'].srsStage).toBe(3);
    });

    it('exports empty objects/arrays when nothing is stored', () => {
      const data = JSON.parse(exportProgress());
      expect(data.grammar).toEqual({});
      expect(data.vocabulary).toEqual([]);
      expect(data.sessions).toEqual([]);
    });
  });

  describe('importProgress', () => {
    it('returns true on successful import', () => {
      const testData = { grammar: { 'g-b1-01': { srsStage: 2 } }, vocabulary: [], sessions: [] };
      expect(importProgress(JSON.stringify(testData))).toBe(true);
    });

    it('restores grammar data to localStorage', () => {
      const testData = { grammar: { 'g-b2-01': { srsStage: 5 } }, vocabulary: [], sessions: [] };
      importProgress(JSON.stringify(testData));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nihongo-master-grammar-srs',
        JSON.stringify(testData.grammar)
      );
    });

    it('returns false on invalid JSON', () => {
      expect(importProgress('not-valid-json')).toBe(false);
    });

    it('returns false on empty string', () => {
      expect(importProgress('')).toBe(false);
    });
  });
});
