#!/bin/bash
# Start Japanese TTS Server for Kaiwa Renshuu

echo "🚀 Starting Japanese TTS Server..."
echo "   Voice: ja-JP-NanamiNeural (Female)"
echo "   Port: 8001"
echo ""

cd "$(dirname "$0")"

# Check if dependencies are installed
if ! python3 -c "import edge_tts" 2>/dev/null; then
    echo "❌ edge-tts not installed. Installing..."
    pip3 install --user fastapi uvicorn edge-tts
fi

# Start server
python3 tts_server.py