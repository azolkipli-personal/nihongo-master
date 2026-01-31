import { StudySession } from '../types';

const SESSIONS_KEY = 'nihongo-master-sessions';

export function saveSession(session: StudySession): void {
  const sessions = loadSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadSessions(): StudySession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored).map((s: StudySession) => ({
        ...s,
        date: new Date(s.date),
      }));
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
  return [];
}

export function getSessionsByType(type: StudySession['type']): StudySession[] {
  return loadSessions().filter(s => s.type === type);
}

export function getSessionsByDateRange(start: Date, end: Date): StudySession[] {
  return loadSessions().filter(s => s.date >= start && s.date <= end);
}

export function getTotalStudyTime(): number {
  return loadSessions().reduce((total, s) => total + s.duration, 0);
}

export function getStudyStreak(): number {
  const sessions = loadSessions();
  if (sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studyDates = new Set(
    sessions.map(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  const checkDate = new Date(today);

  while (studyDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Check if studied today
  if (!studyDates.has(today.getTime())) {
    // Check if studied yesterday to continue streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (studyDates.has(yesterday.getTime())) {
      streak = 1;
    } else {
      streak = 0;
    }
  }

  return streak;
}

export function getWeeklyActivity(): Array<{ date: string; minutes: number; count: number }> {
  const sessions = loadSessions();
  const result: Array<{ date: string; minutes: number; count: number }> = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySessions = sessions.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= date && sDate < nextDate;
    });

    result.push({
      date: date.toISOString().split('T')[0],
      minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
      count: daySessions.length,
    });
  }

  return result;
}

export function exportSessions(): string {
  return JSON.stringify(loadSessions(), null, 2);
}

export function importSessions(json: string): boolean {
  try {
    const sessions = JSON.parse(json);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Error importing sessions:', error);
    return false;
  }
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}
