export const SRS_INTERVALS = [
  0,          // Stage 0 (New)
  4,          // Stage 1: 4 hours
  8,          // Stage 2: 8 hours
  24,         // Stage 3: 1 day
  48,         // Stage 4: 2 days
  168,        // Stage 5: 1 week
  336,        // Stage 6: 2 weeks
  720,        // Stage 7: 1 month
  2880,       // Stage 8: 4 months (Burned)
];

export interface SRSUpdate {
  srsStage: number;
  nextReviewDate: string | null;
  lastReviewDate: string;
  interval: number;
}

export function calculateNextReview(currentStage: number, isCorrect: boolean): SRSUpdate {
  let nextStage: number;

  if (isCorrect) {
    nextStage = Math.min(currentStage + 1, SRS_INTERVALS.length - 1);
  } else {
    // Penalty: drop 1 stage if below 5, drop 2 if 5 or above
    const penalty = currentStage >= 5 ? 2 : 1;
    nextStage = Math.max(currentStage - penalty, 1);
  }

  const intervalHours = SRS_INTERVALS[nextStage];
  const now = new Date();
  const nextDate = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);

  return {
    srsStage: nextStage,
    nextReviewDate: nextStage === SRS_INTERVALS.length - 1 ? null : nextDate.toISOString(),
    lastReviewDate: now.toISOString(),
    interval: intervalHours
  };
}

export function isDueForReview(nextReviewDate: string | null | undefined): boolean {
  if (!nextReviewDate) return false;
  return new Date(nextReviewDate) <= new Date();
}
