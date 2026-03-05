# Changelog

All notable changes to Nihongo Master will be documented in this file.

## [Unreleased]

### Security
- Remove exposed WaniKani API keys from test files
- Fix npm security vulnerability (rollup high severity)

### Fixed
- Fix challenge quiz resetting to question 1 after answering
- Fix module resolution errors in test files
- Fix 2 failing furigana tests
- Fix ESLint warnings (unused variables, missing dependencies, useless escapes)

### Changed
- Move vite-node from dependencies to devDependencies
- Format entire codebase with Prettier

### Added
- ESLint configuration with TypeScript and React support
- Prettier configuration for code formatting
- New npm scripts: `lint`, `lint:fix`, `format`, `format:check`
- @testing-library/dom dependency

### Removed
- Build output files (11 .txt files)
- Test files with exposed API keys

## [1.0.0] - 2026-02-26

### Added
- **KAIWA Tab** - AI-powered conversation practice
  - Generate conversations with vocabulary words
  - Furigana/romaji/English toggles
  - Export to JSON/CSV/Anki
  - Import/export conversation sessions
  - Text-to-speech with Japanese voice

- **BUNPO Tab** - Grammar pattern library
  - 100+ grammar patterns (CEFR B1-C2)
  - Pattern library with search and filters
  - Level upgrader (transform sentences to higher CEFR levels)
  - Challenge mode with fill-in-the-blank quizzes
  - Spaced Repetition System (SRS) for grammar reviews
  - Progress tracking per pattern

- **TANGO Tab** - Vocabulary management
  - WaniKani API integration
  - Sync vocabulary from WaniKani account
  - Smart vocabulary suggestions
  - Study sets management

- **SHINCHOKU Tab** - Progress tracking
  - Study session logging
  - Streak tracking
  - Progress analytics
  - Achievement system

- **Settings**
  - Multi-provider LLM support (Gemini, OpenRouter, Ollama)
  - WaniKani API key configuration
  - Theme customization (light/dark, color themes)
  - Import/export settings

- **Infrastructure**
  - React 18 + TypeScript + Vite
  - Tailwind CSS for styling
  - LocalStorage for data persistence
  - Docker support for deployment
  - Systemd service files for production

### Technical Details
- Build tool: Vite 4.4
- React version: 18.2
- TypeScript version: 5.0
- Test framework: Vitest
- Linting: ESLint 9 with flat config
- Formatting: Prettier 3

---

## Development Phases (Completed)

### Phase 1: Foundation ✅
- Project setup (Vite + React + TS + Tailwind)
- Config file manager
- Settings sidebar
- Header + navigation

### Phase 2: KAIWA Tab ✅
- Input form component
- Gemini/Ollama integration
- Results display with toggles
- Furigana component
- Export functionality

### Phase 3: BUNPO Tab ✅
- Grammar patterns database (100+ patterns)
- Pattern library with filters
- Pattern cards
- Level upgrader
- Challenge mode
- SRS integration

### Phase 4: TANGO Tab ✅
- WaniKani API integration
- Sync functionality
- Smart suggestions algorithm
- Study sets management

### Phase 5: SHINCHOKU + Polish ✅
- Progress tracking
- Analytics dashboard
- Responsive design
- Testing & bug fixes

---

## Future Enhancements (Planned)

- Speech Recognition for pronunciation practice
- Community features (share conversation scenarios)
- Mobile App (React Native)
- Offline Mode
- CEFR Testing system
- Telegram integration for study reminders
