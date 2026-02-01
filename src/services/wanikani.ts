import { WaniKaniItem } from '../types';

const BASE_URL = 'https://api.wanikani.com/v2';

export interface WaniKaniUser {
  id: string;
  username: string;
  level: number;
  profileUrl: string;
}

export async function getUserInfo(apiKey: string): Promise<WaniKaniUser> {
  const response = await fetch(`${BASE_URL}/user`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid WaniKani API key');
    }
    throw new Error(`WaniKani API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    username: data.data.username,
    level: data.data.level,
    profileUrl: data.data.profile_url,
  };
}

export async function getAssignments(apiKey: string, started = true): Promise<{ id: number; subjectId: number; srsStage: number }[]> {
  const allAssignments = [];
  let nextUrl: string | null = `${BASE_URL}/assignments?${started ? 'started=true' : ''}`;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WaniKani API error: ${response.status}`);
    }

    const data = await response.json();
    
    const pageAssignments = data.data.map((item: { id: number; data: { subject_id: number; srs_stage: number } }) => ({
      id: item.id,
      subjectId: item.data.subject_id,
      srsStage: item.data.srs_stage,
    }));
    
    allAssignments.push(...pageAssignments);
    nextUrl = data.pages?.next_url || null;
  }

  return allAssignments;
}

export async function getSubjects(apiKey: string, subjectIds: number[]): Promise<WaniKaniItem[]> {
  if (subjectIds.length === 0) return [];

  // WaniKani limits to 1000 ids per request
  const batches = [];
  for (let i = 0; i < subjectIds.length; i += 1000) {
    batches.push(subjectIds.slice(i, i + 1000));
  }

  const allSubjects: WaniKaniItem[] = [];

  for (const batch of batches) {
    const idsString = batch.join(',');
    const response = await fetch(`${BASE_URL}/subjects?ids=${idsString}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WaniKani API error: ${response.status}`);
    }

    const data = await response.json();
    const subjects = data.data.map((item: { id: number; object: string; data: { characters: string; meanings: { meaning: string; primary: boolean }[]; readings: { reading: string; primary: boolean; type: string }[]; level: number } }) => ({
      id: item.id,
      object: item.object,
      characters: item.data.characters,
      meanings: item.data.meanings || [],
      readings: item.data.readings || [],
      level: item.data.level,
      srsStage: 0,
      spacedRepetitionSystemId: 0,
    }));

    allSubjects.push(...subjects);
  }

  return allSubjects;
}

export async function syncVocabulary(apiKey: string): Promise<WaniKaniItem[]> {
  // Get all started assignments
  const assignments = await getAssignments(apiKey, true);

  // Filter to vocabulary only and get subject IDs
  const subjectIds = assignments.map(a => a.subjectId);

  if (subjectIds.length === 0) return [];

  // Get subject details
  const subjects = await getSubjects(apiKey, subjectIds);

  // Merge SRS stage data
  const assignmentsMap = new Map(assignments.map(a => [a.subjectId, a.srsStage]));

  return subjects
    .filter(s => s.object === 'vocabulary')
    .map(s => ({
      ...s,
      srsStage: assignmentsMap.get(s.id) || 0,
    }));
}

export function getReadyForPractice(items: WaniKaniItem[], minSrsStage = 4): WaniKaniItem[] {
  return items
    .filter(item => item.srsStage >= minSrsStage)
    .sort((a, b) => {
      // Prioritize lower SRS stages (Apprentice over Guru)
      if (a.srsStage !== b.srsStage) return a.srsStage - b.srsStage;
      // Then by level
      return a.level - b.level;
    });
}

export function getByLevel(items: WaniKaniItem[], level: number): WaniKaniItem[] {
  return items.filter(item => item.level === level);
}

export function getBySrsStage(items: WaniKaniItem[], stage: number): WaniKaniItem[] {
  return items.filter(item => item.srsStage === stage);
}

export function getPrimaryReading(item: WaniKaniItem): string | null {
  const primary = item.readings?.find(r => r.primary);
  return primary?.reading || item.readings?.[0]?.reading || null;
}

export function getPrimaryMeaning(item: WaniKaniItem): string | null {
  const primary = item.meanings?.find(m => m.primary);
  return primary?.meaning || item.meanings?.[0]?.meaning || null;
}
