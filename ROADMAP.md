# Roadmap - Nihongo Master

## ✅ Completed Features

### Phase 1-5 (Development Complete)

- [x] KAIWA Tab - AI Conversation Practice
- [x] BUNPO Tab - Grammar Patterns with SRS
- [x] TANGO Tab - WaniKani Integration
- [x] SHINCHOKU Tab - Progress Tracking

### Infrastructure

- [x] React + TypeScript + Vite
- [x] Tailwind CSS
- [x] ESLint + Prettier
- [x] Husky Pre-commit Hooks
- [x] GitHub Actions CI/CD ✅ NEW
- [x] Storybook ✅ NEW

### Code Quality

- [x] Error Boundaries
- [x] Toast Notifications
- [x] TypeScript Strict Mode
- [x] 105 Unit Tests

---

## 🔄 In Progress

Nothing currently in progress.

---

## 🎯 Planned Features

### High Priority

#### 1. Speech Recognition

- **Description:** Add pronunciation practice using Web Speech API
- **Tech:** Native Web Speech API (no external dependencies)
- **Estimated Time:** 2-3 hours
- **File:** `src/components/common/SpeechRecognition.tsx` (new)

#### 2. Progress Charts

- **Description:** Visualize SRS progress and study statistics
- **Tech:** recharts
- **Estimated Time:** 2 hours
- **File:** `src/components/common/ProgressCharts.tsx` (new)

#### 3. Search Functionality

- **Description:** Search grammar patterns and vocabulary
- **Tech:** @orama/orama (local search)
- **Estimated Time:** 2-3 hours

### Medium Priority

#### 4. PWA Support

- **Description:** Offline mode capability with service workers
- **Tech:** vite-plugin-pwa
- **Estimated Time:** 4-6 hours

#### 5. Enhanced Settings

- **Description:** More customization options
- **Estimated Time:** 2 hours

### Lower Priority

#### 6. Mobile App

- **Description:** React Native version
- **Estimated Time:** 2-3 days
- **Note:** Major undertaking

#### 7. Community Features

- **Description:** Share conversation scenarios
- **Estimated Time:** 8-12 hours

#### 8. CEFR Testing System

- **Description:** Formal JLPT/CEFR assessment
- **Estimated Time:** 4-6 hours

---

## 📋 Quick Wins (Backlog)

These can be done in 30 minutes - 1 hour each:

- [ ] Add more unit tests (components)
- [ ] Add visual regression tests with Storybook
- [ ] Create example stories for all components
- [ ] Add keyboard shortcuts documentation
- [ ] Add toast notification for successful actions
- [ ] Improve mobile responsiveness
- [ ] Add dark/light mode toggle preview
- [ ] Add grammar pattern audio playback

---

## 🧪 Testing Roadmap

### Current Coverage

- 105 unit tests
- 9 test files
- ~40% component coverage

### Target Coverage

- 200+ tests
- 80% component coverage
- Visual regression tests with Storybook
- E2E tests with Playwright

---

## 📦 Dependencies to Update

### When Needed

- React 18 → React 19 (when stable)
- Vite 7 → Vite 8 (next major)
- TypeScript 5.0 → 5.x (minor updates)

### Security Updates

```bash
npm audit fix
npm update
```

---

## 📝 Notes

### Running the Project

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Start with TTS
npm run start

# Run tests
npm test

# Run Storybook
npm run storybook

# Build for production
npm run build
```

### Git Workflow

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Commit with Husky hooks
6. Push and create PR

---

## 🤝 Contributing

See CONTRIBUTING.md for guidelines.

---

_Last Updated: 2026-03-07_
