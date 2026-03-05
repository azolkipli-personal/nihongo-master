import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextReview, isDueForReview, SRS_INTERVALS } from '../srsService';

describe('srsService', () => {
  describe('SRS_INTERVALS', () => {
    it('has 9 stages (0-8)', () => {
      expect(SRS_INTERVALS).toHaveLength(9);
    });

    it('starts at 0 hours for stage 0', () => {
      expect(SRS_INTERVALS[0]).toBe(0);
    });

    it('ends at 2880 hours for burned stage (8)', () => {
      expect(SRS_INTERVALS[8]).toBe(2880);
    });
  });

  describe('calculateNextReview', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('advances stage by 1 on correct answer', () => {
      const result = calculateNextReview(0, true);
      expect(result.srsStage).toBe(1);
    });

    it('advances from stage 3 to 4 on correct answer', () => {
      const result = calculateNextReview(3, true);
      expect(result.srsStage).toBe(4);
    });

    it('does not exceed stage 8 (burned)', () => {
      const result = calculateNextReview(8, true);
      expect(result.srsStage).toBe(8);
    });

    it('drops stage by 1 on incorrect answer when below stage 5', () => {
      const result = calculateNextReview(4, false);
      expect(result.srsStage).toBe(3);
    });

    it('drops stage by 2 on incorrect answer at stage 5 or above', () => {
      const result = calculateNextReview(5, false);
      expect(result.srsStage).toBe(3);
    });

    it('drops stage by 2 on incorrect answer at stage 7', () => {
      const result = calculateNextReview(7, false);
      expect(result.srsStage).toBe(5);
    });

    it('does not drop below stage 1 on incorrect answer', () => {
      const result = calculateNextReview(1, false);
      expect(result.srsStage).toBe(1);
    });

    it('returns null nextReviewDate for burned stage (8)', () => {
      const result = calculateNextReview(7, true);
      expect(result.srsStage).toBe(8);
      expect(result.nextReviewDate).toBeNull();
    });

    it('returns a future nextReviewDate for non-burned stages', () => {
      const result = calculateNextReview(0, true);
      expect(result.nextReviewDate).not.toBeNull();
      const reviewDate = new Date(result.nextReviewDate!);
      expect(reviewDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('sets lastReviewDate to current time', () => {
      const result = calculateNextReview(2, true);
      expect(new Date(result.lastReviewDate).toISOString()).toBe('2026-03-04T12:00:00.000Z');
    });

    it('interval matches SRS_INTERVALS for next stage', () => {
      const result = calculateNextReview(2, true); // advances to stage 3
      expect(result.interval).toBe(SRS_INTERVALS[3]);
    });
  });

  describe('isDueForReview', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for a past date', () => {
      expect(isDueForReview('2026-03-01T00:00:00Z')).toBe(true);
    });

    it('returns false for a future date', () => {
      expect(isDueForReview('2026-03-10T00:00:00Z')).toBe(false);
    });

    it('returns false for null (burned item)', () => {
      expect(isDueForReview(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isDueForReview(undefined)).toBe(false);
    });

    it('returns true for exactly the current time', () => {
      expect(isDueForReview('2026-03-04T12:00:00Z')).toBe(true);
    });
  });
});
