#!/bin/bash
# Nihongo Master Watchdog Launcher
# Starts both the web app and TTS server with internal health monitoring
# If any process dies, this script exits → systemd Restart=always kicks in

set -e

APP_DIR="/home/azolkipli/Projects/nihongo-master"
APP_PORT=3000
TTS_PORT=8001
HEALTH_INTERVAL=30

echo "🚀 Starting Nihongo Master (watchdog mode)..."
echo "   App port: $APP_PORT"
echo "   TTS port: $TTS_PORT"
echo "   Health check every ${HEALTH_INTERVAL}s"
echo ""

cd "$APP_DIR"

cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $TTS_PID $APP_PID 2>/dev/null
    wait $TTS_PID $APP_PID 2>/dev/null
    echo "👋 Done"
    exit 0
}
trap cleanup SIGTERM SIGINT

# Start TTS server
echo "🎙️  Starting Japanese TTS server..."
python3 "$APP_DIR/server/tts_server.py" &
TTS_PID=$!
echo "   PID: $TTS_PID"

sleep 2

# Start production app (built version)
echo "🌐 Starting web app (preview mode)..."
cd "$APP_DIR"
npm run preview -- --host 0.0.0.0 --port "$APP_PORT" &
APP_PID=$!
echo "   PID: $APP_PID"

echo ""
echo "✅ Both services running!"
echo "   - App:  http://localhost:$APP_PORT"
echo "   - TTS:  http://localhost:$TTS_PORT"
echo "   - Tailnet: http://100.84.210.22:$APP_PORT"
echo ""

# Health check loop
while true; do
    sleep "$HEALTH_INTERVAL"

    # Check TTS server
    if ! kill -0 $TTS_PID 2>/dev/null; then
        echo "❌ TTS server died! Restarting..."
        exit 1
    fi

    # Check web app
    if ! kill -0 $APP_PID 2>/dev/null; then
        echo "❌ Web app died! Restarting..."
        exit 1
    fi

    # Optional: HTTP health check
    if ! curl -sf "http://localhost:$TTS_PORT/" > /dev/null 2>&1; then
        echo "❌ TTS server unresponsive! Restarting..."
        exit 1
    fi
done
