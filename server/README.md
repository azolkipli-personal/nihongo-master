# Japanese TTS Server for Kaiwa Renshuu

This server provides Japanese text-to-speech using Microsoft Edge TTS API.

## Setup

1. Install dependencies:
```bash
pip3 install fastapi uvicorn edge-tts
```

2. Start the server:
```bash
cd server
python3 tts_server.py
```

The server will run on `http://localhost:8001`

## API Endpoints

- `POST /tts` - Convert Japanese text to speech
  - Body: `{"text": "こんにちは", "speed": "+0%"}`
  - Returns: `{"audio_url": "/audio/xxx.mp3", "text": "こんにちは"}`

- `GET /audio/{filename}` - Get audio file

- `GET /voices` - List available voices

## Frontend Integration

The frontend automatically calls `http://localhost:8001/tts` when you click the play button on each dialogue line.

## Notes

- Uses `ja-JP-NanamiNeural` voice (Female)
- Audio files are cached in `/tmp/tts_output`
- Server runs on port 8001