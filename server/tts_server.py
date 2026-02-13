#!/usr/bin/env python3
"""
Japanese TTS Server for Kaiwa Renshuu App
Uses edge-tts with ja-JP-NanamiNeural voice
"""

import asyncio
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import uvicorn

app = FastAPI(title="Japanese TTS Server", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICE = "ja-JP-NanamiNeural"
OUTPUT_DIR = "/tmp/tts_output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

class TTSRequest(BaseModel):
    text: str
    speed: str = "+0%"  # +0% to +100% or -0% to -100%

class TTSResponse(BaseModel):
    audio_url: str
    text: str

@app.get("/")
async def root():
    return {"status": "ok", "service": "Japanese TTS", "voice": VOICE}

@app.post("/tts", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest):
    """
    Convert Japanese text to speech
    """
    try:
        # Clean text - remove any problematic characters
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text is empty")
        
        # Generate filename
        import hashlib
        text_hash = hashlib.md5(f"{text}{request.speed}".encode()).hexdigest()[:8]
        filename = f"tts_{text_hash}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        # Check if file already exists
        if os.path.exists(filepath):
            pass  # Will return existing file
        
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(filepath)
        
        # Return the file URL
        # Note: In production, this should be a proper URL
        audio_url = f"/audio/{filename}"
        
        return TTSResponse(audio_url=audio_url, text=text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve audio files"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio not found")
    from fastapi.responses import FileResponse
    return FileResponse(filepath, media_type="audio/mpeg")

@app.get("/voices")
async def list_voices():
    """List available voices"""
    return {
        "voices": [
            {"id": "ja-JP-NanamiNeural", "name": "Nanami", "gender": "Female"},
            {"id": "ja-JP-KeitaNeural", "name": "Keita", "gender": "Male"},
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)