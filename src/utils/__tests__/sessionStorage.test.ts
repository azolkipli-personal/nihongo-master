import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    saveSession,
    loadSessions,
    getSessionsByType,
    getStudyStreak,
    getWeeklyActivity,
    clearSessions,
} from '../sessionStorage';
import { StudySession } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
    return {
        id: Math.random().toString(36).slice(2),
        date: new Date(),
        type: 'kaiwa',
        duration: 10,
        itemsStudied: 5,
        ...overrides,
    };
}

function daysAgo(n: number): Date {
    const d = new Date('2026-03-04T10:00:00Z');
    d.setDate(d.getDate() - n);
    return d;
}

describe('sessionStorage utilities', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-04T10:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('saveSession / loadSessions', () => {
        it('returns empty array when no sessions are stored', () => {
            expect(loadSessions()).toEqual([]);
        });

        it('saves and loads a session correctly', () => {
            const session = makeSession({ id: 'test-1' });
            saveSession(session);
            const loaded = loadSessions();
            expect(loaded).toHaveLength(1);
            expect(loaded[0].id).toBe('test-1');
        });

        it('accumulates multiple sessions', () => {
            saveSession(makeSession({ id: 'a' }));
            saveSession(makeSession({ id: 'b' }));
            expect(loadSessions()).toHaveLength(2);
        });

        it('restores date as a Date object', () => {
            const session = makeSession({ id: 'date-test', date: new Date('2026-03-01T00:00:00Z') });
            saveSession(session);
            const loaded = loadSessions();
            expect(loaded[0].date).toBeInstanceOf(Date);
        });
    });

    describe('getSessionsByType', () => {
        it('filters sessions by type', () => {
            saveSession(makeSession({ type: 'kaiwa' }));
            saveSession(makeSession({ type: 'bunpo' }));
            saveSession(makeSession({ type: 'kaiwa' }));
            expect(getSessionsByType('kaiwa')).toHaveLength(2);
            expect(getSessionsByType('bunpo')).toHaveLength(1);
        });
    });

    describe('getStudyStreak', () => {
        it('returns 0 when there are no sessions', () => {
            expect(getStudyStreak()).toBe(0);
        });

        it('returns 1 for a session today only', () => {
            saveSession(makeSession({ date: daysAgo(0) }));
            expect(getStudyStreak()).toBe(1);
        });

        it('counts consecutive days correctly', () => {
            saveSession(makeSession({ date: daysAgo(0) }));
            saveSession(makeSession({ date: daysAgo(1) }));
            saveSession(makeSession({ date: daysAgo(2) }));
            expect(getStudyStreak()).toBe(3);
        });

        it('resets streak when there is a gap', () => {
            saveSession(makeSession({ date: daysAgo(0) }));
            saveSession(makeSession({ date: daysAgo(1) }));
            // Gap: day 2 missing
            saveSession(makeSession({ date: daysAgo(3) }));
            expect(getStudyStreak()).toBe(2);
        });
    });

    describe('getWeeklyActivity', () => {
        it('returns exactly 7 entries', () => {
            const activity = getWeeklyActivity();
            expect(activity).toHaveLength(7);
        });

        it('all entries have date, minutes, and count fields', () => {
            const activity = getWeeklyActivity();
            activity.forEach(entry => {
                expect(entry).toHaveProperty('date');
                expect(entry).toHaveProperty('minutes');
                expect(entry).toHaveProperty('count');
            });
        });

        it('reflects sessions added today', () => {
            saveSession(makeSession({ duration: 15 }));
            saveSession(makeSession({ duration: 20 }));
            const activity = getWeeklyActivity();
            const today = activity[activity.length - 1];
            expect(today.count).toBe(2);
            expect(today.minutes).toBe(35);
        });
    });

    describe('clearSessions', () => {
        it('removes all sessions from storage', () => {
            saveSession(makeSession());
            saveSession(makeSession());
            clearSessions();
            expect(loadSessions()).toEqual([]);
        });
    });
});
