# Nihongo Master (日本語 Master)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/azolkipli-personal/nihongo-master)
[![Tests](https://img.shields.io/badge/tests-105%20passing-brightgreen)](https://github.com/azolkipli-personal/nihongo-master)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A unified Japanese learning platform combining AI-powered conversation practice, CEFR B1-C2 grammar mastery, and WaniKani integration.

## ✨ Features

### 🗣️ 会話 KAIWA (Conversation Practice)

- AI-powered conversation generation with vocabulary words
- Furigana/romaji/English toggle support
- Export to JSON/CSV/Anki format
- Japanese text-to-speech with natural voice
- Practice sessions saved automatically

### 📚 文法 BUNPO (Grammar Mastery)

- 100+ grammar patterns (CEFR B1-C2 levels)
- Pattern library with search and filters
- Level upgrader (transform sentences to higher CEFR levels)
- Fill-in-the-blank challenge mode
- Spaced Repetition System (SRS) for grammar reviews
- Progress tracking per pattern

### 📝 単語 TANGO (Vocabulary)

- WaniKani API integration
- Sync vocabulary from your WaniKani account
- Smart vocabulary suggestions
- Study sets management

### 📊 進捗 SHINCHOKU (Progress)

- Study session logging
- Streak tracking
- Progress analytics
- Achievement system

### ⚙️ Settings

- Multi-provider LLM support (Gemini, OpenRouter, Ollama)
- WaniKani API key configuration
- Theme customization (light/dark, color themes)
- Import/export settings

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript 5.0, Tailwind CSS
- **Build Tool:** Vite 7
- **Testing:** Vitest, React Testing Library
- **Code Quality:** ESLint 9, Prettier 3, Husky
- **AI Integration:** Google Gemini API, OpenRouter, Ollama
- **APIs:** WaniKani API
- **TTS:** edge-tts (Japanese)

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3.8+ (for TTS server)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/azolkipli-personal/nihongo-master.git
   cd nihongo-master
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the app (with TTS)**
   ```bash
   npm run start
   ```
   This starts both the Vite dev server (port 5173) and TTS server (port 8001).

### Manual Start

```bash
# Terminal 1: Start TTS server
python3 server/tts_server.py

# Terminal 2: Start Vite dev server
npm run dev
```

## 🚀 Available Scripts

| Command              | Description               |
| -------------------- | ------------------------- |
| `npm run dev`        | Start development server  |
| `npm run start`      | Start app + TTS server    |
| `npm run build`      | Build for production      |
| `npm run test`       | Run tests                 |
| `npm run test:watch` | Run tests in watch mode   |
| `npm run lint`       | Lint code                 |
| `npm run lint:fix`   | Fix lint issues           |
| `npm run format`     | Format code with Prettier |

## 🌐 URLs

| Service     | URL                   |
| ----------- | --------------------- |
| App (local) | http://localhost:5173 |
| TTS API     | http://localhost:8001 |

## 📖 Documentation

- [Design Document](./DESIGN.md) - Complete specifications
- [Changelog](./CHANGELOG.md) - Version history
- [Testing Guide](./TESTING.md) - Testing documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for running linters on staged files

Pre-commit hooks automatically:

- Fix ESLint issues
- Format code with Prettier
- Run tests

## 📊 Project Status

- ✅ Build: Passing
- ✅ Tests: 105/105 passing
- ✅ Security: 0 vulnerabilities
- ✅ Coverage: Active test suite

## 🗺️ Roadmap

### Completed ✅

- [x] KAIWA Tab (Conversation Practice)
- [x] BUNPO Tab (Grammar Library + SRS)
- [x] TANGO Tab (WaniKani Integration)
- [x] SHINCHOKU Tab (Progress Tracking)
- [x] Multi-provider LLM support
- [x] Error boundaries
- [x] Toast notifications
- [x] Pre-commit hooks

### Planned 🔮

- [ ] Speech Recognition for pronunciation practice
- [ ] PWA support for offline usage
- [ ] Mobile app (React Native)
- [ ] Community features (share scenarios)
- [ ] CEFR Testing system
- [ ] Telegram integration for reminders

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WaniKani](https://www.wanikani.com/) for their amazing Japanese learning platform
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for beautiful icons

---

Made with ❤️ for Japanese learners
