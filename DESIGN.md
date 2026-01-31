# Nihongo Master - Design Document

## 1. Executive Summary

**Nihongo Master** is a unified Japanese learning platform combining:
- AI-powered conversation practice (Kaiwa Renshuu)
- CEFR B1-C2 grammar mastery (Grammar Dojo)
- WaniKani SRS integration (Tango Hub)
- Progress tracking & analytics (Shinchoku)

**Target User**: Ammar Zolkipli (IT engineer in Tokyo, WaniKani L13, CEFR B1→B2 goal)

---

## 2. User Experience Flow

### 2.1 Primary User Journey

```
New User Onboarding:
├─→ Welcome Screen
├─→ Settings: Configure API keys (WaniKani, Gemini/Ollama)
├─→ Quick Tutorial (3 steps)
└─→ Main Dashboard

Daily Study Flow:
├─→ Check "Study Suggestions" (AI-curated based on WaniKani + gaps)
├─→ Choose activity:
│   ├─ Kaiwa: Generate conversations with learned vocabulary
│   ├─ Bunpo: Study grammar patterns at current CEFR level
│   └─ Challenge: Gap-fill exercises
├─→ Practice with furigana/romaji/english toggles
└─→ Track progress in Shinchoku
```

### 2.2 Information Architecture

```
Nihongo Master
├── Header (Navigation + Settings Gear)
│
├── Main Content Area (Tab-based)
│   ├── Tab 1: 会話 KAIWA (Conversation Practice)
│   │   ├── Input Section (word/scenario)
│   │   ├── Results Display (5 conversations)
│   │   └── Saved Sessions
│   │
│   ├── Tab 2: 文法 BUNPO (Grammar Mastery)
│   │   ├── Pattern Library (B1-C2, searchable)
│   │   ├── Level Upgrader (B1→C2 transformer)
│   │   └── Challenge Mode (gap-fill quiz)
│   │
│   ├── Tab 3: 単語 TANGO (Vocabulary Hub)
│   │   ├── WaniKani Sync Status
│   │   ├── Ready to Practice (learned but unused)
│   │   └── Study Sets (custom collections)
│   │
│   └── Tab 4: 進捗 SHINCHOKU (Progress)
│       ├── Weekly Activity
│       ├── Grammar Mastery Chart
│       └── CEFR Level Estimate
│
├── Settings Sidebar (Slide-out)
│   ├── API Configuration
│   ├── Display Preferences
│   ├── LLM Service Selection
│   └── Theme Selection
│
└── Footer
```

---

## 3. Component Specifications

### 3.1 Layout Components

#### Header
```typescript
interface HeaderProps {
  activeTab: 'kaiwa' | 'bunpo' | 'tango' | 'shinchoku';
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  userProfile?: {
    name: string;
    level: string;
    streak: number;
  };
}
```

**Visual Design:**
- Height: 64px
- Background: White with subtle shadow
- Logo: "日本語 Master" with kanji + English
- Tabs: Icon + text (vertical on mobile)
- Settings gear icon (top right)

#### Settings Sidebar
```typescript
interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

interface AppConfig {
  // API Keys (stored in ~/.nihongo-master/config.json)
  wanikaniApiKey: string;
  geminiApiKey: string;
  ollamaUrl: string;
  
  // LLM Service
  llmService: 'gemini' | 'ollama';
  geminiModel: string;
  ollamaModel: string;
  
  // Display
  defaultShowFurigana: boolean;
  defaultShowRomaji: boolean;
  defaultShowEnglish: boolean;
  theme: 'sky' | 'emerald' | 'violet' | 'rose' | 'amber';
  
  // Study
  targetCefrLevel: 'B1' | 'B2' | 'C1' | 'C2';
}
```

**Sections:**
1. API Configuration (collapsible)
2. LLM Service Selection
3. Display Preferences
4. Theme Selector
5. Data Management (export/import)

---

### 3.2 Feature Components

#### Furigana Component
```typescript
interface FuriganaProps {
  text: string;  // Format: "漢字[かんじ]"
  className?: string;
}

// Usage: <Furigana text="具体的[ぐたいてき]" />
```

**Behavior:**
- Parses text for pattern: `([一-龯]+)\[(.+?)\]`
- Renders as: `<ruby>漢字<rt>かんじ</rt></ruby>`
- CSS: `ruby { ruby-position: over; } rt { font-size: 0.5em; }`

#### Toggle Button Group
```typescript
interface ToggleGroupProps {
  options: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }>;
  active: string[];
  onChange: (id: string) => void;
}

// Usage for Furigana/Romaji/English toggles
```

---

### 3.3 Tab Components

#### KAIWA Tab (会話)

**InputSection Component:**
```typescript
interface InputSectionProps {
  onGenerate: (words: string[], scenario: string) => void;
  isLoading: boolean;
  suggestedWords?: string[];  // From WaniKani
}
```

**Features:**
- Word input textarea (comma/newline separated)
- File upload (.txt vocabulary lists)
- Scenario/context input
- "Suggested from WaniKani" chips
- Generate button with loading state

**ResultsDisplay Component:**
```typescript
interface ResultsDisplayProps {
  results: KaiwaResult[];
  showFurigana: boolean;
  showRomaji: boolean;
  showEnglish: boolean;
  onExport: () => void;
  onDelete: (index: number) => void;
}

interface KaiwaResult {
  wordDetails: {
    kanji: string;
    kana: string;
    romaji: string;
  };
  meaning: string;
  conversations: Conversation[];
}

interface Conversation {
  title: string;
  dialogue: DialogueLine[];
}

interface DialogueLine {
  speaker: string;
  japanese: string;  // With furigana markup
  romaji: string;
  english: string;
}
```

---

#### BUNPO Tab (文法)

**PatternLibrary Component:**
```typescript
interface PatternLibraryProps {
  patterns: GrammarPattern[];
  filters: {
    level: 'all' | 'B1' | 'B2' | 'C1' | 'C2';
    category: string;
    search: string;
  };
  showFurigana: boolean;
  showEnglish: boolean;
  onUsePattern: (pattern: GrammarPattern) => void;
}

interface GrammarPattern {
  id: string;
  pattern: string;  // "～次第[しだい]です"
  reading: string;
  meaning: string;
  cefr: 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  jlpt?: string;
  formality: 'casual' | 'neutral' | 'formal' | 'very-formal';
  examples: {
    japanese: string;
    reading: string;
    english: string;
  }[];
  mastered: boolean;
  usageCount: number;
}
```

**Features:**
- Level selector tabs (B1/B2/C1/C2)
- Category filter dropdown
- Search bar
- Pattern cards with expand/collapse
- "Mark as Mastered" button
- "Use in Practice" button

**LevelUpgrader Component:**
```typescript
interface LevelUpgraderProps {
  onUpgrade: (text: string, targetLevel: string) => Promise<UpgradeResult>;
}

interface UpgradeResult {
  original: string;
  upgraded: string;
  explanation: string;
  patternsUsed: string[];
}
```

**ChallengeMode Component:**
```typescript
interface ChallengeModeProps {
  patterns: GrammarPattern[];
  onComplete: (score: number, total: number) => void;
}

// Gap-fill quiz with multiple choice
// Score tracking
// Hint system
```

---

#### TANGO Tab (単語)

**WaniKaniSync Component:**
```typescript
interface WaniKaniSyncProps {
  apiKey: string;
  onSync: (vocabulary: WaniKaniItem[]) => void;
  lastSync?: Date;
}

interface WaniKaniItem {
  id: number;
  characters: string;
  meanings: string[];
  readings: string[];
  level: number;
  srsStage: number;
  learnedDate: Date;
  usedInPractice: boolean;
}
```

**SmartSuggestions Component:**
```typescript
interface SmartSuggestionsProps {
  vocabulary: WaniKaniItem[];
  practiceHistory: PracticeRecord[];
  onSelect: (word: WaniKaniItem) => void;
}

// AI-curated list of words ready for conversation practice
// Filters: Apprentice 4+, not recently practiced
```

---

#### SHINCHOKU Tab (進捗)

**ActivityChart Component:**
- Weekly activity heatmap
- Study streak counter
- Time spent per activity

**MasteryDashboard Component:**
- Grammar patterns by CEFR level (progress bars)
- Words practiced vs learned ratio
- CEFR level estimate based on mastered patterns

---

## 4. Data Models

### 4.1 Local Config File

**Location:** `~/.nihongo-master/config.json`

```json
{
  "version": "1.0.0",
  "apiKeys": {
    "wanikani": "6c296e88-7aeb-484e-ae7c-5ebd04679042",
    "gemini": "YOUR_GEMINI_KEY_HERE"
  },
  "llmConfig": {
    "service": "gemini",
    "geminiModel": "gemini-3-flash-preview",
    "ollamaUrl": "http://localhost:11434",
    "ollamaModel": "llama3"
  },
  "display": {
    "theme": "sky",
    "defaultShowFurigana": true,
    "defaultShowRomaji": true,
    "defaultShowEnglish": true
  },
  "study": {
    "targetCefrLevel": "B2",
    "dailyGoal": {
      "conversations": 5,
      "grammarPatterns": 3,
      "vocabulary": 20
    }
  }
}
```

### 4.2 Session Data

**Location:** `~/.nihongo-master/sessions/`

```typescript
interface Session {
  id: string;
  date: Date;
  type: 'kaiwa' | 'bunpo' | 'challenge';
  data: KaiwaResult[] | ChallengeResult;
  metadata: {
    wordsStudied: string[];
    patternsEncountered: string[];
    duration: number;
  };
}
```

### 4.3 Grammar Patterns Database

**Location:** `src/data/grammar-patterns.json`

```json
[
  {
    "id": "b1-nakerebanaranai",
    "pattern": "～なければならない",
    "patternWithFurigana": "～なければならない",
    "reading": "～なければならない",
    "meaning": "must ~; have to ~",
    "cefr": "B1",
    "jlpt": "N4",
    "category": "obligation",
    "formality": "neutral",
    "examples": [
      {
        "japanese": "明日[あした]までに報告書[ほうこくしょ]を出[だ]さなければならない",
        "reading": "あしたまでにほうこくしょをださなければならない",
        "english": "I must submit the report by tomorrow"
      }
    ]
  }
]
```

---

## 5. API Integrations

### 5.1 WaniKani API

**Endpoint:** `https://api.wanikani.com/v2/`

**Required Calls:**
- `GET /user` - Verify API key & get user info
- `GET /assignments?started=true` - Get all started items
- `GET /subjects?ids=` - Get subject details

**Sync Strategy:**
- Fetch on app startup (if key configured)
- Cache in memory + localStorage
- Manual refresh button
- Auto-refresh every 24 hours

### 5.2 Gemini API

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta`

**Models:**
- `gemini-3-flash-preview` (default, free tier)
- `gemini-3-pro-preview` (higher quality)

**Prompts:**

**Conversation Generation:**
```
Generate 5 contextual Japanese conversations for the word "{word}".
Scenario: {scenario}

For each conversation:
1. Title (in English)
2. 3-5 dialogue lines with:
   - Speaker name
   - Japanese text with furigana in format: 漢字[かんじ]
   - Romaji
   - English translation

Requirements:
- Use natural business Japanese
- Include B2-level grammar patterns
- Make conversations practical for daily use

Return as JSON.
```

**Sentence Upgrade:**
```
Upgrade this Japanese sentence to {targetLevel} level:
Original: {originalSentence}

Requirements:
- Maintain same meaning
- Use {targetLevel}-appropriate grammar and vocabulary
- Add nuance and sophistication

Return:
- upgraded: the new sentence
- explanation: what was changed and why
- patternsUsed: list of grammar patterns used
```

### 5.3 Ollama API (Optional)

**Endpoint:** User-configurable (default: `http://localhost:11434`)

**Models:** llama3, mistral, etc.

---

## 6. State Management

### 6.1 Global State (React Context)

```typescript
interface AppState {
  // Config
  config: AppConfig;
  updateConfig: (config: Partial<AppConfig>) => void;
  
  // WaniKani
  wanikaniData: WaniKaniItem[] | null;
  syncWaniKani: () => Promise<void>;
  
  // UI
  activeTab: string;
  isSettingsOpen: boolean;
  
  // Study Session
  currentSession: Session | null;
  saveSession: (session: Session) => void;
}
```

### 6.2 Local State (Component-level)

- Input forms
- Toggle states (furigana/romaji/english)
- Loading states
- Error messages

---

## 7. Responsive Design

### 7.1 Breakpoints

- **Mobile:** < 640px (single column, bottom nav)
- **Tablet:** 640px - 1024px (two columns where applicable)
- **Desktop:** > 1024px (full layout)

### 7.2 Mobile Adaptations

- Header becomes bottom navigation bar
- Settings becomes full-screen modal
- Pattern cards stack vertically
- Input forms use full width

---

## 8. Error Handling

### 8.1 API Errors

**WaniKani:**
- 401: Invalid API key → Show settings prompt
- 429: Rate limited → Retry with backoff
- 500: Server error → Show error message

**Gemini:**
- 400: Invalid request → Show error details
- 429: Quota exceeded → Suggest Ollama or wait
- 500: Model error → Retry or fallback

### 8.2 User Feedback

- Toast notifications for actions
- Loading spinners with progress
- Error banners with recovery actions
- Empty states with helpful guidance

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Furigana parser
- Config file manager
- API service functions

### 9.2 Integration Tests
- Tab navigation
- Settings save/load
- WaniKani sync flow
- Conversation generation

### 9.3 E2E Tests
- Complete study session flow
- Export/import functionality
- Theme switching

---

## 10. Future Enhancements (Post-MVP)

- **Speech Recognition:** Practice pronunciation
- **Spaced Repetition:** Built-in SRS for grammar
- **Community:** Share conversation scenarios
- **Mobile App:** React Native version
- **Offline Mode:** Full functionality without internet

---

## 11. Development Phases

### Phase 1: Foundation (2-3 hours)
- [ ] Project setup (Vite + React + TS + Tailwind)
- [ ] Config file manager
- [ ] Settings sidebar
- [ ] Header + navigation

### Phase 2: KAIWA Tab (3-4 hours)
- [ ] Input form component
- [ ] Gemini/Ollama integration
- [ ] Results display with toggles
- [ ] Furigana component
- [ ] Export functionality

### Phase 3: BUNPO Tab (4-5 hours)
- [ ] Grammar patterns database (50 patterns with furigana)
- [ ] Pattern library with filters
- [ ] Pattern cards
- [ ] Level upgrader
- [ ] Challenge mode

### Phase 4: TANGO Tab (3-4 hours)
- [ ] WaniKani API integration
- [ ] Sync functionality
- [ ] Smart suggestions algorithm
- [ ] Study sets management

### Phase 5: SHINCHOKU + Polish (2-3 hours)
- [ ] Progress tracking
- [ ] Analytics dashboard
- [ ] Responsive design
- [ ] Testing & bug fixes

**Total: 14-19 hours**

---

**Ready to proceed with build?**