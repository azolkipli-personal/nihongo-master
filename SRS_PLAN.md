# Implementation Plan: Grammar Spaced Repetition System (SRS) for Nihongo Master

## Goal
Implement a Spaced Repetition System (SRS) for grammar patterns in the `nihongo-master` app to help Bro Ammar master Japanese grammar through scientifically proven recall intervals.

## Phase 1: Data Model Update
- Modify `GrammarPattern` interface in `src/types/index.ts`.
- Add fields:
    - `srsStage: number` (0 to 8, where 8 is burned/mastered).
    - `nextReviewDate: string | null` (ISO string).
    - `lastReviewDate: string | null` (ISO string).
    - `interval: number` (current interval in hours).

## Phase 2: SRS Logic Service
- Create `src/services/srsService.ts`.
- Implement `calculateNextReview(currentStage: number, isCorrect: boolean)` based on a simplified SM-2 or WaniKani-style interval system:
    - Stage 0 -> Stage 1: 4 hours
    - Stage 1 -> Stage 2: 8 hours
    - Stage 2 -> Stage 3: 24 hours (1 day)
    - Stage 3 -> Stage 4: 48 hours (2 days)
    - Stage 4 -> Stage 5: 1 week
    - Stage 5 -> Stage 6: 2 weeks
    - Stage 6 -> Stage 7: 1 month
    - Stage 7 -> Stage 8: 4 months (Burned)
- Penalty for incorrect: Drop 1 or 2 stages.

## Phase 3: UI Enhancements (BunpoTab)
- **New Sub-tab:** "Review" (shows patterns due for review).
- **Library View Update:** Display current SRS stage/progress bar for each pattern.
- **Mastery Calculation:** Update progress calculation to use `srsStage` instead of a simple boolean `mastered`.

## Phase 4: Integration
- Update `localStorage` persistence logic to save SRS data.
- Update `ChallengeMode` to prioritize items that are due for review.

## Phase 5: Telegram Integration (Future-proofing)
- The SRS data in `localStorage` can be exposed via an API or exported to a file that the OpenClaw agent can read to send Telegram reminders.

---
*Created by Abam Bro (OpenClaw) - 2026-02-26*
