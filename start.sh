#!/bin/bash
# Nihongo Master - Startup Script
# Starts both Vite dev server and Japanese TTS server

echo "🚀 Starting Nihongo Master..."
echo "================================"

# Kill any existing processes on ports
lsof -ti:5173 | xargs -r kill 2>/dev/null
lsof -ti:8001 | xargs -r kill 2>/dev/null

sleep 1

# Start TTS server in background
echo "🎙️  Starting Japanese TTS server (port 8001)..."
python3 server/tts_server.py &
TTS_PID=$!
echo "   TTS server PID: $TTS_PID"

# Give TTS server time to initialize
sleep 2

# Start Vite dev server
echo "🌐 Starting Vite dev server (port 5173)..."
npm run dev -- --host 0.0.0.0 --port 5173 &
VITE_PID=$!
echo "   Vite server PID: $VITE_PID"

echo "================================"
echo "✅ Nihongo Master is running!"
echo "   - App: http://localhost:5173"
echo "   - TTS: http://localhost:8001"
echo "   - Tailnet: http://100.84.210.22:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================"

# Wait for both processes
wait