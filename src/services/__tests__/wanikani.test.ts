import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserInfo,
  getAssignments,
  syncVocabulary,
  getReadyForPractice,
  getPrimaryReading,
  getPrimaryMeaning,
} from '../wanikani';
import { WaniKaniItem } from '../../types';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeWKItem(overrides: Partial<WaniKaniItem> = {}): WaniKaniItem {
  return {
    id: 1,
    object: 'vocabulary',
    characters: '具体的',
    meanings: [{ meaning: 'concrete', primary: true }],
    readings: [{ reading: 'ぐたいてき', primary: true, type: 'kunyomi' }],
    level: 5,
    srsStage: 4,
    spacedRepetitionSystemId: 1,
    ...overrides,
  };
}

describe('WaniKani service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserInfo', () => {
    it('returns parsed user data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-1',
          data: { username: 'ammar', level: 13, profile_url: 'https://wanikani.com/users/ammar' },
        }),
      });

      const user = await getUserInfo('test-key');
      expect(user.username).toBe('ammar');
      expect(user.level).toBe(13);
    });

    it('throws on 401 (invalid API key)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(getUserInfo('bad-key')).rejects.toThrow('Invalid WaniKani API key');
    });

    it('throws on other API errors', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getUserInfo('test-key')).rejects.toThrow('WaniKani API error: 500');
    });
  });

  describe('getAssignments', () => {
    it('returns assignments from a single page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 1, data: { subject_id: 101, srs_stage: 5 } },
            { id: 2, data: { subject_id: 102, srs_stage: 3 } },
          ],
          pages: { next_url: null },
        }),
      });

      const assignments = await getAssignments('test-key');
      expect(assignments).toHaveLength(2);
      expect(assignments[0].subjectId).toBe(101);
      expect(assignments[0].srsStage).toBe(5);
    });

    it('handles paginated responses', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: 1, data: { subject_id: 101, srs_stage: 5 } }],
            pages: { next_url: 'https://api.wanikani.com/v2/assignments?page_after_id=1' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: 2, data: { subject_id: 102, srs_stage: 3 } }],
            pages: { next_url: null },
          }),
        });

      const assignments = await getAssignments('test-key');
      expect(assignments).toHaveLength(2);
    });
  });

  describe('syncVocabulary', () => {
    it('returns only vocabulary type items', async () => {
      // getAssignments mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 1, data: { subject_id: 101, srs_stage: 5 } }],
          pages: { next_url: null },
        }),
      });
      // getSubjects mock — returns one vocabulary and one kanji
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 101,
              object: 'vocabulary',
              data: { characters: '具体的', meanings: [], readings: [], level: 5 },
            },
            {
              id: 102,
              object: 'kanji',
              data: { characters: '具', meanings: [], readings: [], level: 5 },
            },
          ],
        }),
      });

      const result = await syncVocabulary('test-key');
      expect(result).toHaveLength(1);
      expect(result[0].object).toBe('vocabulary');
    });
  });

  describe('getReadyForPractice', () => {
    it('filters by minimum SRS stage (default 4)', () => {
      const items = [
        makeWKItem({ srsStage: 3 }),
        makeWKItem({ srsStage: 4 }),
        makeWKItem({ srsStage: 7 }),
      ];
      const ready = getReadyForPractice(items);
      expect(ready).toHaveLength(2);
      ready.forEach((item: WaniKaniItem) => expect(item.srsStage).toBeGreaterThanOrEqual(4));
    });

    it('returns items sorted by srsStage ascending', () => {
      const items = [
        makeWKItem({ srsStage: 7 }),
        makeWKItem({ srsStage: 4 }),
        makeWKItem({ srsStage: 5 }),
      ];
      const ready = getReadyForPractice(items);
      expect(ready[0].srsStage).toBe(4);
      expect(ready[1].srsStage).toBe(5);
      expect(ready[2].srsStage).toBe(7);
    });

    it('respects custom minimum SRS stage', () => {
      const items = [makeWKItem({ srsStage: 2 }), makeWKItem({ srsStage: 6 })];
      const ready = getReadyForPractice(items, 2);
      expect(ready).toHaveLength(2);
    });
  });

  describe('getPrimaryReading / getPrimaryMeaning', () => {
    it('returns the primary reading', () => {
      const item = makeWKItem({
        readings: [
          { reading: 'ぐたいてき', primary: true, type: 'kunyomi' },
          { reading: 'other', primary: false, type: 'onyomi' },
        ],
      });
      expect(getPrimaryReading(item)).toBe('ぐたいてき');
    });

    it('returns the primary meaning', () => {
      const item = makeWKItem({
        meanings: [
          { meaning: 'concrete', primary: true },
          { meaning: 'specific', primary: false },
        ],
      });
      expect(getPrimaryMeaning(item)).toBe('concrete');
    });

    it('falls back to first reading if no primary', () => {
      const item = makeWKItem({
        readings: [{ reading: 'fallback', primary: false, type: 'onyomi' }],
      });
      expect(getPrimaryReading(item)).toBe('fallback');
    });

    it('returns null for empty readings array', () => {
      const item = makeWKItem({ readings: [] });
      expect(getPrimaryReading(item)).toBeNull();
    });
  });
});
