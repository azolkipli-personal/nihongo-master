export interface AppConfig {
  wanikaniApiKey: string;
  geminiApiKey: string;
  openrouterApiKey: string;
  selectedService: 'gemini' | 'openrouter' | 'ollama';
  geminiModel: string;
  ollamaModel: string;
  ollamaUrl: string;
  theme: 'light' | 'dark' | 'emerald' | 'ocean';
  showFurigana: boolean;
  showRomaji: boolean;
  showEnglish: boolean;
  userLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
}

export interface GrammarPattern {
  id: string;
  pattern: string;
  patternWithFurigana: string;
  reading: string;
  meaning: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  formality: 'casual' | 'neutral' | 'formal' | 'very-formal';
  examples: {
    japanese: string;
    japaneseWithFurigana: string;
    romaji: string;
    english: string;
  }[];
  mastered: boolean;
  lastReviewed?: Date;
}

export interface WaniKaniItem {
  id: number;
  object: 'vocabulary' | 'kanji' | 'radical';
  characters: string;
  meanings: { meaning: string; primary: boolean }[];
  readings: { reading: string; primary: boolean; type: 'onyomi' | 'kunyomi' | 'nanori' }[];
  level: number;
  srsStage: number;
  spacedRepetitionSystemId: number;
}

export interface Conversation {
  id: string;
  title: string;
  words: string[];
  scenario: string;
  service: string;
  createdAt: Date;
  dialogue: {
    speaker: string;
    japanese: string;
    japaneseWithFurigana: string;
    romaji: string;
    english: string;
  }[];
  wordDetails?: {
    kanji: string;
    kana: string;
    romaji: string;
  };
  meaning?: string;
}

export interface StudySession {
  id: string;
  date: Date;
  type: 'kaiwa' | 'bunpo' | 'challenge' | 'vocabulary';
  duration: number;
  itemsStudied: number;
  score?: number;
}

export interface TestResult {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  confidence: number;
  breakdown: {
    grammar: { score: number; level: string };
    reading: { score: number; level: string };
    vocabulary: { score: number; level: string };
    transformation: { score: number; level: string };
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendedGrammarPatterns: string[];
  nextMilestone: string;
}

export type TabType = 'kaiwa' | 'bunpo' | 'tango' | 'shinchoku';
export type BunpoSubTab = 'library' | 'upgrader' | 'challenge';
export type TangoSubTab = 'sync' | 'vocabulary' | 'suggestions' | 'sets';
export type ShinchokuSubTab = 'overview' | 'activity' | 'mastery' | 'cefr';
