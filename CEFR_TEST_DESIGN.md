# CEFR Level Assessment Feature Design

## 1. Overview

**Purpose**: Assess user's Japanese CEFR level (A1-C2) to personalize learning path
**Location**: New tab "テスト TEST" or integrated into onboarding
**Duration**: 10-15 minutes adaptive test

---

## 2. Assessment Types

### 2.1 Initial Placement Test (Onboarding)
**When**: First app launch or manual trigger
**Length**: 15-20 questions (adaptive)
**Covers**:
- Grammar recognition (25%)
- Reading comprehension (25%)
- Vocabulary usage (25%)
- Sentence construction (25%)

### 2.2 Progress Check (Periodic)
**When**: Every 2 weeks or after milestone
**Length**: 10 questions
**Focus**: Recent learning areas

### 2.3 Skill-Specific Test
**When**: User wants to assess specific skill
**Options**:
- Grammar only
- Reading only
- Listening (future feature)
- Speaking (future feature)

---

## 3. Test Question Types

### 3.1 Grammar Recognition
```typescript
interface GrammarQuestion {
  type: 'grammar-recognition';
  level: 'B1' | 'B2' | 'C1' | 'C2';
  pattern: string;
  context: string;  // Sentence with blank
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// Example:
{
  level: 'B2',
  pattern: '～次第です',
  context: '資料[しりょう]を確認[かくにん]＿＿＿、ご連絡[れんらく]いたします。',
  options: ['次第[しだい]で', '次第[しだい]です', '次第[しだい]に', '次第[しだい]は'],
  correctAnswer: '次第[しだい]です',
  explanation: '～次第です means "as soon as" and follows the dictionary form of a verb'
}
```

### 3.2 Reading Comprehension
```typescript
interface ReadingQuestion {
  type: 'reading-comprehension';
  level: 'B1' | 'B2' | 'C1' | 'C2';
  passage: string;  // Japanese text with furigana
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

// Example B2 level:
{
  level: 'B2',
  passage: '来週[らいしゅう]の会議[かいぎ]についてですが、出席[しゅっせき]者[しゃ]次第[しだい]で日程[にってい]を決[き]めたいと思[おも]います。',
  questions: [{
    question: 'What is the main purpose of this message?',
    options: [
      'To cancel the meeting',
      'To decide the schedule based on attendees',
      'To ask for meeting topics',
      'To confirm the meeting location'
    ],
    correctAnswer: 'To decide the schedule based on attendees'
  }]
}
```

### 3.3 Vocabulary Usage
```typescript
interface VocabularyQuestion {
  type: 'vocabulary-usage';
  level: 'B1' | 'B2' | 'C1' | 'C2';
  word: string;
  wordWithFurigana: string;
  meaning: string;
  context: string;  // Sentence with blank
  options: string[];
  correctAnswer: string;
}

// Example:
{
  level: 'B2',
  word: '具体的',
  wordWithFurigana: '具体的[ぐたいてき]',
  meaning: 'concrete, specific',
  context: 'もう少し＿＿＿に説明[せつめい]していただけますか。',
  options: ['具体的[ぐたいてき]に', '基本的[きほんてき]に', '簡単[かんたん]に', '丁寧[ていねい]に'],
  correctAnswer: '具体的[ぐたいてき]に'
}
```

### 3.4 Sentence Transformation
```typescript
interface TransformationQuestion {
  type: 'sentence-transformation';
  level: 'B1' | 'B2' | 'C1' | 'C2';
  original: string;
  instruction: string;  // e.g., "Make it more formal"
  targetLevel: 'B1' | 'B2' | 'C1' | 'C2';
  acceptableAnswers: string[];
  explanation: string;
}

// Example:
{
  level: 'B2',
  original: '明日[あした]終[お]わります。',
  instruction: 'Upgrade to formal business Japanese (B2 level)',
  targetLevel: 'B2',
  acceptableAnswers: [
    '明日[あした]には完了[かんりょう]する予定[よてい]です。',
    '明日[あした]までに終了[しゅうりょう]させていただきます。'
  ],
  explanation: 'B2 business Japanese uses formal vocabulary and humble forms'
}
```

### 3.5 Contextual Usage (C1-C2 only)
```typescript
interface ContextualQuestion {
  type: 'contextual-usage';
  level: 'C1' | 'C2';
  scenario: string;  // Business meeting, email, casual conversation
  situation: string;  // What user wants to express
  options: string[];  // Different ways to say it
  correctAnswer: string;
  nuanceExplanation: string;
}

// Example C1:
{
  level: 'C1',
  scenario: 'You need to decline a meeting politely but firmly',
  situation: 'Express that you cannot attend due to a conflict',
  options: [
    '行[い]けません。',  // Too blunt
    '残念[ざんねん]ですが、別[べつ]の予定[よてい]がありまして、参加[さんか]できかねます。',  // Correct
    'ちょっと無理[むり]です。',  // Too casual
    'また今度[こんど]にしてください。'  // Not appropriate
  ],
  correctAnswer: '残念[ざんねん]ですが、別[べつ]の予定[よてい]がありまして、参加[さんか]できかねます。',
  nuanceExplanation: '～かねます is a humble, polite way to express inability in business contexts'
}
```

---

## 4. Adaptive Testing Algorithm

### 4.1 How It Works

```typescript
interface AdaptiveTest {
  currentLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  questionsAsked: number;
  correctStreak: number;
  incorrectStreak: number;
  levelHistory: ('up' | 'down' | 'same')[];
}

// Algorithm:
// 1. Start at B1 (middle)
// 2. If 2 correct in a row → level up
// 3. If 2 incorrect in a row → level down
// 4. Continue until:
//    - 15 questions asked, OR
//    - Stable at same level for 5 questions
// 5. Calculate final level with confidence score
```

### 4.2 Level Determination

| Pattern | Result |
|---------|--------|
| Reaches C2 with 80%+ correct | C2 |
| Stable at C1 | C1 |
| Alternates B2/C1 | B2+ (approaching C1) |
| Stable at B2 | B2 |
| Alternates B1/B2 | B1+ (approaching B2) |
| Stable at B1 | B1 |
| Below B1 | A2 or A1 (suggest foundation study) |

---

## 5. Test Question Database

### 5.1 Question Distribution by Level

| Level | Grammar | Reading | Vocab | Transform | Total |
|-------|---------|---------|-------|-----------|-------|
| B1 | 30 | 20 | 30 | 20 | 100 |
| B2 | 35 | 25 | 25 | 15 | 100 |
| C1 | 30 | 30 | 20 | 20 | 100 |
| C2 | 25 | 35 | 15 | 25 | 100 |

### 5.2 Sample Questions by Level

**B1 Examples:**
- ～なければならない (must)
- ～てもいい (permission)
- ～は～より～ (comparisons)
- ～たことがある (experience)

**B2 Examples:**
- ～次第です (as soon as)
- ～つつある (in progress)
- ～わけにはいかない (cannot)
- ～ものだ (general truth)

**C1 Examples:**
- ～ざるを得ない (cannot help but)
- ～やいなや (as soon as - literary)
- ～ながらも (despite)
- ～とはいえ (although)

**C2 Examples:**
- ～ごとき (like - literary)
- ～ともなく (without thinking)
- ～そこにあらず (lies not in)
- ～にもほどがある (there's a limit to)

---

## 6. Results & Recommendations

### 6.1 Result Display

```typescript
interface TestResult {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  confidence: number;  // 0-100%
  breakdown: {
    grammar: { score: number; level: string };
    reading: { score: number; level: string };
    vocabulary: { score: number; level: string };
    transformation: { score: number; level: string };
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendedGrammarPatterns: string[];  // Specific patterns to study
  nextMilestone: string;
}
```

### 6.2 Result Screen UI

```
┌─────────────────────────────────────────────────────────────┐
│  Your CEFR Level Assessment                                   │
│                                                              │
│  ┌─────────────────────────────────────┐                     │
│  │                                     │                     │
│  │         B2                          │                     │
│  │    ━━━━━━━━━━━━                     │                     │
│  │    Upper-Intermediate               │                     │
│  │                                     │                     │
│  │    Confidence: 87%                  │                     │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  Skill Breakdown:                                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Grammar        ████████████████████░░░░  B2 (78%)  │     │
│  │ Reading        █████████████████████░░░  B2 (82%)  │     │
│  │ Vocabulary     ███████████████████░░░░░  B1+ (72%) │     │
│  │ Transformation ██████████████████████░░  B2 (85%)  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  🎯 You're approaching C1!                                   │
│                                                              │
│  Strengths:                                                  │
│  ✓ B2 grammar patterns (～次第です, ～つつある)              │
│  ✓ Business Japanese formality                              │
│                                                              │
│  Focus Areas:                                                │
│  ⚠ C1 complex structures (～ざるを得ない)                    │
│  ⚠ Advanced vocabulary (C1-C2 level)                        │
│                                                              │
│  Recommended Next Steps:                                     │
│  • Study 5 C1 grammar patterns (see Bunpo tab)              │
│  • Practice with "Upgrade to C1" feature                    │
│  • Target: C1 in 4-6 weeks                                  │
│                                                              │
│  [Set as My Target Level]  [Retake Test]  [Close]           │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Personalized Study Plan

Based on test results, auto-generate study plan:

```typescript
interface StudyPlan {
  currentLevel: string;
  targetLevel: string;
  estimatedWeeks: number;
  weeklyGoals: {
    grammarPatterns: number;
    conversations: number;
    vocabulary: number;
  };
  recommendedPatterns: string[];  // Specific grammar to focus on
  dailyChallenges: ChallengeType[];
}

// Example B2→C1 plan:
{
  currentLevel: 'B2',
  targetLevel: 'C1',
  estimatedWeeks: 6,
  weeklyGoals: {
    grammarPatterns: 5,
    conversations: 10,
    vocabulary: 50
  },
  recommendedPatterns: [
    '～ざるを得ない',
    '～やいなや',
    '～ながらも',
    '～とはいえ',
    '～きりがない'
  ],
  dailyChallenges: ['gap-fill', 'sentence-upgrade', 'conversation']
}
```

---

## 7. Test Implementation

### 7.1 Components

**TestContainer.tsx** - Main test orchestrator
```typescript
interface TestContainerProps {
  testType: 'placement' | 'progress' | 'skill-specific';
  onComplete: (result: TestResult) => void;
  onCancel: () => void;
}
```

**QuestionCard.tsx** - Renders different question types
```typescript
interface QuestionCardProps {
  question: GrammarQuestion | ReadingQuestion | VocabularyQuestion | TransformationQuestion | ContextualQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}
```

**ProgressBar.tsx** - Shows test progress
```typescript
interface ProgressBarProps {
  current: number;
  total: number;
  estimatedTimeRemaining: number;
}
```

**ResultDashboard.tsx** - Displays results
```typescript
interface ResultDashboardProps {
  result: TestResult;
  onSetTarget: () => void;
  onRetake: () => void;
  onClose: () => void;
}
```

### 7.2 Data Structure

**test-questions.json:**
```json
{
  "b1": {
    "grammar": [
      {
        "id": "b1-gr-001",
        "pattern": "～なければならない",
        "question": "明日[あした]までに報告書[ほうこくしょ]を出[だ]さ＿＿＿。",
        "options": ["なければならない", "なくてもいい", "なくてはいけない", "ないほうがいい"],
        "correct": "なければならない",
        "explanation": "～なければならない expresses obligation - must do something"
      }
    ]
  },
  "b2": { ... },
  "c1": { ... },
  "c2": { ... }
}
```

---

## 8. Integration with Existing Features

### 8.1 Connection to BUNPO Tab
- Test identifies weak grammar patterns
- Auto-suggests those patterns in Bunpo tab
- Track improvement over time

### 8.2 Connection to TANGO Tab
- Test assesses vocabulary level
- Compare with WaniKani level
- Identify gaps between SRS knowledge and usage

### 8.3 Connection to SHINCHOKU Tab
- Track CEFR progress over time
- Show level history graph
- Estimate time to next level

### 8.4 Personalized Content
```typescript
// Use test results to personalize content
const personalizedContent = {
  // In Kaiwa: generate conversations at user's level
  conversationDifficulty: userLevel,
  
  // In Bunpo: prioritize patterns below user's level
  recommendedPatterns: getPatternsUpToLevel(userLevel),
  
  // In Tango: suggest vocabulary at appropriate level
  vocabularySuggestions: getVocabularyAtLevel(userLevel)
};
```

---

## 9. Technical Considerations

### 9.1 Scoring Algorithm

```typescript
function calculateCEFRLevel(answers: Answer[]): CEFRLevel {
  const levelScores = {
    A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0
  };
  
  answers.forEach(answer => {
    if (answer.correct) {
      levelScores[answer.questionLevel] += 1;
    }
  });
  
  // Weight recent answers more heavily
  // Consider streaks and patterns
  // Return level with highest weighted score
}
```

### 9.2 Anti-Cheating Measures
- Shuffle question order
- Randomize option order
- Time limits per question (optional)
- No retries on same test session

### 9.3 Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Adjustable font sizes

---

## 10. Future Enhancements

### 10.1 Listening Test (Future)
- Audio clips at different speeds
- Comprehension questions
- Shadowing exercises

### 10.2 Speaking Test (Future)
- Voice recording
- AI pronunciation assessment
- Fluency measurement

### 10.3 Writing Test (Future)
- Essay prompts
- Email writing
- AI grading with feedback

### 10.4 Peer Comparison
- Compare with other users at same level
- Percentile ranking
- Study group matching

---

## 11. Implementation Phases

### Phase 1: Core Test (2-3 hours)
- [ ] TestContainer component
- [ ] QuestionCard component with all types
- [ ] Progress tracking
- [ ] Basic scoring algorithm
- [ ] 20 test questions (5 per level B1-C2)

### Phase 2: Results & UI (2 hours)
- [ ] ResultDashboard component
- [ ] Study plan generation
- [ ] Personalized recommendations
- [ ] Integration with existing tabs

### Phase 3: Full Question Bank (3-4 hours)
- [ ] 100 questions per level
- [ ] Reading passages
- [ ] Transformation exercises
- [ ] Contextual usage questions

### Phase 4: Polish (1-2 hours)
- [ ] Adaptive algorithm refinement
- [ ] Animations and transitions
- [ ] Accessibility
- [ ] Testing and bug fixes

**Total: 8-11 hours**

---

**Ready to implement CEFR testing?** This would add significant value by:
1. Helping users understand their current level
2. Personalizing the learning experience
3. Providing clear goals and progress tracking
4. Differentiating from other Japanese learning apps