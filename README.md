# Nihongo Master (日本語 Master)

A unified Japanese learning platform combining AI-powered conversation practice, CEFR B1-C2 grammar mastery, and WaniKani integration.

## Features

- **会話 KAIWA** - AI conversation practice with furigana/romaji/english toggles
- **文法 BUNPO** - Grammar pattern library (B1-C2) with level upgrader and challenges
- **単語 TANGO** - WaniKani sync + smart vocabulary suggestions
- **進捗 SHINCHOKU** - Progress tracking and analytics
- **🎙️ Japanese TTS** - Text-to-speech with `ja-JP-NanamiNeural` voice

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Vite
- Google Gemini API / Ollama
- WaniKani API
- edge-tts (Japanese TTS)

## Getting Started

### Quick Start (App + TTS)
```bash
npm run start
```
This starts both the Vite dev server (port 5173) and TTS server (port 8001).

### Manual Start
```bash
# Terminal 1: Start TTS server
python3 server/tts_server.py

# Terminal 2: Start Vite dev server
npm run dev -- --host 0.0.0.0 --port 5173
```

## URLs

| Service | URL |
|---------|-----|
| App (local) | http://localhost:5173 |
| App (tailnet) | http://100.84.210.22:5173 |
| TTS API | http://localhost:8001 |

## Design Document

See [DESIGN.md](./DESIGN.md) for complete specifications.

## License

MIT