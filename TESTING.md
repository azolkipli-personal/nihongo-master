# Nihongo Master - Comprehensive Test Plan

## 1. Testing Overview

### 1.1 Testing Levels

| Level | Scope | Tools | Responsibility |
|-------|-------|-------|----------------|
| Unit | Individual functions/components | Jest + React Testing Library | Developers |
| Integration | Component interactions | Jest + MSW | Developers |
| E2E | Full user workflows | Playwright | QA/Developers |
| Manual | Exploratory + UX | Browser + Checklist | QA/Product |
| Performance | Load times, responsiveness | Lighthouse + k6 | Developers |

### 1.2 Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | http://localhost:5173 | Development, unit tests |
| Staging | https://staging.nihongo-master.dev | Integration, E2E tests |
| Production | https://nihongo-master.app | Final validation |

---

## 2. Unit Tests

### 2.1 Config Manager (`src/utils/configManager.ts`)

```typescript
describe('configManager', () => {
  test('loadConfig() returns default config when file does not exist', () => {
    // Mock fs to return ENOENT
    // Expect default config structure
  });

  test('loadConfig() parses existing config file', () => {
    // Create temp config file
    // Expect parsed config object
  });

  test('saveConfig() writes config to file', () => {
    // Save test config
    // Verify file written with correct content
  });

  test('updateConfig() merges partial updates', () => {
    // Start with base config
    // Update partial fields
    // Expect merged result
  });

  test('sanitizeConfig() removes sensitive data for logs', () => {
    // Input config with API keys
    // Expect keys masked/redacted
  });
});
```

### 2.2 Furigana Component (`src/components/common/Furigana.tsx`)

```typescript
describe('Furigana', () => {
  test('renders plain text without markup', () => {
    // Input: "hello"
    // Output: "hello" (no ruby tags)
  });

  test('parses 漢字[かんじ] format correctly', () => {
    // Input: "具体的[ぐたいてき]です"
    // Output: <ruby>具体的<rt>ぐたいてき</rt></ruby>です
  });

  test('handles multiple furigana in one string', () => {
    // Input: "日本語[にほんご]を勉強[べんきょう]する"
    // Output: Multiple ruby elements
  });

  test('handles nested brackets gracefully', () => {
    // Input: "漢字[かんじ[extra]]"
    // Output: Correct parsing or error boundary
  });

  test('renders with custom className', () => {
    // Input: text + className
    // Output: Element with custom class
  });
});
```

### 2.3 LLM Service (`src/services/llm.ts`)

```typescript
describe('LLM Service', () => {
  describe('generateConversation', () => {
    test('calls Gemini API with correct parameters', async () => {
      // Mock fetch
      // Expect correct URL, headers, body
    });

    test('calls OpenRouter API when service=openrouter', async () => {
      // Mock fetch
      // Expect OpenRouter endpoint
    });

    test('returns structured conversation data', async () => {
      // Mock successful response
      // Expect: { conversations: [...], wordDetails: {...} }
    });

    test('throws error on API failure', async () => {
      // Mock 500 error
      // Expect: throws with meaningful message
    });

    test('throws error on invalid API key', async () => {
      // Mock 401 error
      // Expect: throws "Invalid API key"
    });
  });

  describe('generateUpgrade', () => {
    test('transforms B1 sentence to B2', async () => {
      // Input: "明日終わります", target: "B2"
      // Expect: upgraded sentence with explanation
    });

    test('transforms B2 sentence to C1', async () => {
      // Input: B2 sentence, target: "C1"
      // Expect: more sophisticated version
    });
  });
});
```

### 2.4 WaniKani Service (`src/services/wanikani.ts`)

```typescript
describe('WaniKani Service', () => {
  test('getUserInfo() returns user data', async () => {
    // Mock API response
    // Expect: { username, level, ... }
  });

  test('getAssignments() returns started items', async () => {
    // Mock paginated response
    // Expect: Array of assignments
  });

  test('getSubjects() fetches subject details', async () => {
    // Mock subjects endpoint
    // Expect: Subject data with readings/meanings
  });

  test('throws on invalid API key', async () => {
    // Mock 401
    // Expect: Auth error
  });

  test('throws on rate limit', async () => {
    // Mock 429
    // Expect: Rate limit error with retry info
  });
});
```

### 2.5 Grammar Pattern Utils

```typescript
describe('Grammar Pattern Utilities', () => {
  test('filterByLevel() returns only matching CEFR level', () => {
    // Input: array of patterns, level: "B2"
    // Expect: Only B2 patterns
  });

  test('filterByCategory() returns only matching category', () => {
    // Input: patterns, category: "obligation"
    // Expect: Only obligation patterns
  });

  test('searchPatterns() matches pattern name', () => {
    // Input: patterns, query: "次第"
    // Expect: Patterns containing "次第"
  });

  test('searchPatterns() matches meaning', () => {
    // Input: patterns, query: "depends"
    // Expect: Patterns with "depends" in meaning
  });
});
```

---

## 3. Integration Tests

### 3.1 Settings Flow

```typescript
describe('Settings Integration', () => {
  test('user can open settings, update API key, and save', async () => {
    // Render App
    // Click settings gear
    // Enter WaniKani API key
    // Click save
    // Verify config file updated
    // Verify sidebar closes
  });

  test('settings persist across app reload', async () => {
    // Set theme to "emerald"
    // Reload page
    // Verify theme still emerald
  });

  test('invalid API key shows error', async () => {
    // Enter invalid WaniKani key
    // Try to sync
    // Expect error message in UI
  });
});
```

### 3.2 KAIWA Tab Flow

```typescript
describe('KAIWA Tab Integration', () => {
  test('complete conversation generation flow', async () => {
    // Render KaiwaTab
    // Type word: "具体的"
    // Enter scenario: "work meeting"
    // Select service: Gemini
    // Click generate
    // Expect loading state
    // Expect results displayed with furigana
    // Expect toggle buttons work
  });

  test('export saves JSON file', async () => {
    // Generate conversation
    // Click export
    // Verify file download triggered
    // Verify JSON structure correct
  });

  test('toggle furigana/romaji/english hides/shows content', async () => {
    // Generate conversation
    // Toggle off furigana
    // Expect furigana hidden
    // Toggle on romaji
    // Expect romaji shown
  });
});
```

### 3.3 BUNPO Tab Flow

```typescript
describe('BUNPO Tab Integration', () => {
  test('filter patterns by CEFR level', async () => {
    // Render BunpoTab
    // Click B2 filter
    // Expect only B2 patterns displayed
    // Click C1 filter
    // Expect only C1 patterns
  });

  test('search finds matching patterns', async () => {
    // Type "depends" in search
    // Expect patterns with "depends" in meaning
  });

  test('level upgrader transforms sentence', async () => {
    // Go to Upgrader sub-tab
    // Enter: "明日終わります"
    // Select target: B2
    // Click upgrade
    // Expect upgraded sentence
    // Expect explanation shown
  });

  test('challenge mode tracks score', async () => {
    // Start challenge
    // Answer question correctly
    // Expect score: 1/5
    // Answer incorrectly
    // Expect score: 1/5, shows correct answer
  });
});
```

### 3.4 TANGO Tab Flow

```typescript
describe('TANGO Tab Integration', () => {
  test('sync WaniKani fetches vocabulary', async () => {
    // Enter valid API key
    // Click sync
    // Expect loading state
    // Expect vocabulary list displayed
  });

  test('smart suggestions shows ready words', async () => {
    // Sync completed
    // Go to Suggestions
    // Expect words with srs_stage >= 4
  });

  test('practice word opens in KAIWA', async () => {
    // Click "Practice" on vocabulary
    // Expect tab switched to KAIWA
    // Expect word pre-filled in input
  });
});
```

### 3.5 Cross-Tab Integration

```typescript
describe('Cross-Tab Integration', () => {
  test('grammar pattern → practice in conversation', async () => {
    // In Bunpo, find pattern
    // Click "Use in conversation"
    // Expect KAIWA tab open
    // Expect pattern noted in scenario
  });

  test('vocabulary → practice in conversation', async () => {
    // In Tango, find word
    // Click "Practice"
    // Expect KAIWA tab open
    // Expect word pre-filled
  });

  test('activity tracked in Shinchoku', async () => {
    // Complete KAIWA session
    // Complete Bunpo challenge
    // Go to Shinchoku
    // Expect activity recorded
  });
});
```

---

## 4. E2E Tests (Playwright)

### 4.1 Test Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
```

### 4.2 E2E Test Cases

```typescript
// e2e/happy-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Happy Path - Complete Study Session', () => {
  test('user completes full study workflow', async ({ page }) => {
    // 1. Open app
    await page.goto('/');
    await expect(page.locator('text=日本語 Master')).toBeVisible();

    // 2. Configure settings
    await page.click('[aria-label="Settings"]');
    await page.fill('[name="wanikaniApiKey"]', process.env.TEST_WK_API_KEY);
    await page.fill('[name="geminiApiKey"]', process.env.TEST_GEMINI_API_KEY);
    await page.click('text=Save Settings');

    // 3. Go to TANGO and sync
    await page.click('text=TANGO');
    await page.click('text=Sync with WaniKani');
    await expect(page.locator('text=Sync completed')).toBeVisible({ timeout: 10000 });

    // 4. Practice a word in KAIWA
    const wordCard = page.locator('.vocabulary-card').first();
    const wordText = await wordCard.locator('.kanji').textContent();
    await wordCard.locator('text=Practice').click();
    
    // Should be in KAIWA tab
    await expect(page.locator('text=KAIWA')).toHaveClass(/active/);
    await expect(page.locator('[name="words"]')).toHaveValue(wordText);

    // 5. Generate conversation
    await page.fill('[name="scenario"]', 'daily conversation');
    await page.click('text=Generate');
    
    // Wait for results
    await expect(page.locator('.conversation-card')).toHaveCount(5, { timeout: 30000 });

    // 6. Study a grammar pattern in BUNPO
    await page.click('text=BUNPO');
    await page.click('text=B2'); // Filter B2
    await page.locator('.pattern-card').first().click();
    await expect(page.locator('.pattern-detail')).toBeVisible();

    // 7. Check progress in SHINCHOKU
    await page.click('text=SHINCHOKU');
    await expect(page.locator('.activity-chart')).toBeVisible();
    await expect(page.locator('.streak-counter')).toContainText('1');
  });
});
```

```typescript
// e2e/settings.spec.ts
test.describe('Settings Management', () => {
  test('theme changes apply immediately', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Settings"]');
    
    // Change to emerald theme
    await page.click('[data-theme="emerald"]');
    await page.click('text=Save');
    
    // Verify CSS variable changed
    const primaryColor = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
    );
    expect(primaryColor.trim()).toBe('#34d399');
  });

  test('API keys persist after reload', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Settings"]');
    
    const testKey = 'test-api-key-12345';
    await page.fill('[name="wanikaniApiKey"]', testKey);
    await page.click('text=Save');
    
    // Reload
    await page.reload();
    
    // Verify key still there
    await page.click('[aria-label="Settings"]');
    await expect(page.locator('[name="wanikaniApiKey"]')).toHaveValue(testKey);
  });
});
```

```typescript
// e2e/offline.spec.ts
test.describe('Offline Functionality', () => {
  test('grammar patterns work offline', async ({ page, context }) => {
    await page.goto('/');
    await page.click('text=BUNPO');
    
    // Go offline
    await context.setOffline(true);
    
    // Should still show patterns (loaded from JSON)
    await expect(page.locator('.pattern-card')).toHaveCount.greaterThan(0);
  });
});
```

---

## 5. Manual Testing Checklist

### 5.1 Installation & Setup

- [ ] Clone repo successfully
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server on port 5173
- [ ] App loads in browser without console errors
- [ ] Settings sidebar opens/closes smoothly

### 5.2 Settings Configuration

- [ ] Can enter WaniKani API key
- [ ] Can enter Gemini API key
- [ ] Can enter OpenRouter API key
- [ ] Can switch between services (Gemini/OpenRouter/Cohere/Ollama)
- [ ] Theme changes apply immediately
- [ ] Display toggles (furigana/romaji/english) work
- [ ] Settings persist after page reload
- [ ] Settings saved to `~/.nihongo-master/config.json`

### 5.3 KAIWA Tab

- [ ] Input form accepts single word
- [ ] Input form accepts multiple words (comma separated)
- [ ] Scenario input works
- [ ] Can select different LLM services
- [ ] Generate button shows loading state
- [ ] Results display 5 conversations
- [ ] Each conversation has title + dialogue
- [ ] Furigana displays correctly (ruby tags)
- [ ] Romaji toggle hides/shows romaji
- [ ] English toggle hides/shows translations
- [ ] Export to JSON works
- [ ] Can delete individual results
- [ ] Error messages display on API failure

### 5.4 BUNPO Tab

- [ ] Pattern library loads with all 50 patterns
- [ ] B1/B2/C1/C2 filters work
- [ ] Category filter works
- [ ] Search finds patterns by name
- [ ] Search finds patterns by meaning
- [ ] Pattern cards expand/collapse
- [ ] Examples show with furigana
- [ ] Can mark pattern as mastered
- [ ] Level upgrader transforms sentences
- [ ] Upgrade shows before/after comparison
- [ ] Challenge mode loads questions
- [ ] Can answer questions
- [ ] Score tracks correctly
- [ ] Hints display helpful information

### 5.5 TANGO Tab

- [ ] Can enter WaniKani API key
- [ ] Sync button fetches vocabulary
- [ ] Progress indicator during sync
- [ ] Vocabulary displays in grid
- [ ] Can filter by WaniKani level
- [ ] Smart suggestions shows relevant words
- [ ] "Practice" button opens KAIWA with word
- [ ] Can create custom study sets
- [ ] Can add/remove words from sets
- [ ] Study sets persist

### 5.6 SHINCHOKU Tab

- [ ] Activity chart displays
- [ ] Study streak counter works
- [ ] Grammar mastery shows progress
- [ ] CEFR estimate updates based on progress
- [ ] Weekly summary accurate

### 5.7 Cross-Tab Features

- [ ] Tango → Kaiwa integration works
- [ ] Bunpo → Kaiwa integration works
- [ ] Activity tracked across tabs
- [ ] Session data persists

### 5.8 Responsive Design

- [ ] Mobile layout (< 640px) works
- [ ] Tablet layout (640px - 1024px) works
- [ ] Desktop layout (> 1024px) works
- [ ] Touch interactions work on mobile
- [ ] Settings sidebar adapts to screen size

### 5.9 Accessibility

- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Screen reader compatible
- [ ] Focus indicators visible

### 5.10 Performance

- [ ] Initial load < 3 seconds
- [ ] Tab switching < 500ms
- [ ] API responses show loading states
- [ ] No memory leaks (check after 30 min usage)
- [ ] Works smoothly on low-end devices

---

## 6. Performance Testing

### 6.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
```

**Targets:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### 6.2 Load Testing

```javascript
// load-test.js (k6)
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:5173');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'load time < 500ms': (r) => r.timings.waiting < 500,
  });
}
```

---

## 7. Test Data

### 7.1 Mock WaniKani API Key
```
Test Key: 6c296e88-7aeb-484e-ae7c-5ebd04679042 (Ammar's key - use sparingly)
Mock Key for tests: test-wk-key-12345
```

### 7.2 Mock Gemini API Key
```
Test Key: Use environment variable TEST_GEMINI_API_KEY
```

### 7.3 Test Vocabulary List
```
具体的, 基本的, 確認, 連絡, 準備
```

---

## 8. CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## 9. Bug Report Template

```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior

## Actual Behavior

## Screenshots/Videos

## Environment
- OS: 
- Browser: 
- Version: 
- API Service: 

## Console Errors
```
[paste errors]
```

## Severity
- [ ] Critical (app crash/data loss)
- [ ] High (feature broken)
- [ ] Medium (workaround exists)
- [ ] Low (cosmetic)
```

---

## 10. Test Sign-Off Criteria

Before release, all must pass:

- [ ] 100% unit test coverage for utils
- [ ] 80% unit test coverage for components
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Manual testing checklist complete
- [ ] Lighthouse scores > 90
- [ ] No critical or high bugs open
- [ ] Accessibility audit passed
- [ ] Performance budget met
- [ ] Cross-browser testing complete

---

**Test Plan Version:** 1.0
**Last Updated:** 2026-01-31
**Owner:** Development Team