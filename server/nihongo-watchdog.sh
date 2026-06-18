#!/bin/bash
# Nihongo Master Watchdog Launcher
# Starts web app, TTS server, and sync backend with internal health monitoring
# If any process dies, this script exits → systemd Restart=always kicks in

set -e

APP_DIR="/home/azolkipli/Projects/nihongo-master"
APP_PORT=3000
TTS_PORT=8001
BACKEND_PORT=9001
PROXY_PORT=8080
HEALTH_INTERVAL=30

echo "🚀 Starting Nihongo Master (watchdog mode)..."
echo "   App:      port $APP_PORT"
echo "   TTS:      port $TTS_PORT"
echo "   Backend:  port $BACKEND_PORT"
echo "   Proxy:    port $PROXY_PORT"
echo "   Health check every ${HEALTH_INTERVAL}s"
echo ""

cd "$APP_DIR"

cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $TTS_PID $APP_PID $BACKEND_PID $PROXY_PID 2>/dev/null
    wait $TTS_PID $APP_PID $BACKEND_PID $PROXY_PID 2>/dev/null
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

# Start sync backend (localhost only)
echo "🔌 Starting sync backend..."
NIHONGO_HOST=127.0.0.1 python3 "$APP_DIR/server/main.py" &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

sleep 2

# Start reverse proxy
echo "🔁 Starting reverse proxy..."
python3 "$APP_DIR/server/reverse_proxy.py" &
PROXY_PID=$!
echo "   PID: $PROXY_PID"

sleep 2

# Start production app (built version)
echo "🌐 Starting web app (preview mode)..."
cd "$APP_DIR"
npx vite preview --host 0.0.0.0 --port "$APP_PORT" &
APP_PID=$!
echo "   PID: $APP_PID"

echo ""
echo "✅ All services running!"
echo "   - App:     http://localhost:$APP_PORT"
echo "   - TTS:     http://localhost:$TTS_PORT"
echo "   - Backend: http://localhost:$BACKEND_PORT"
echo "   - Proxy:   http://localhost:$PROXY_PORT"
echo ""

# Health check loop
while true; do
    sleep "$HEALTH_INTERVAL"

    # Check reverse proxy
    if ! kill -0 $PROXY_PID 2>/dev/null; then
        echo "❌ Reverse proxy died (PID gone)! Restarting..."
        exit 1
    fi
    if ! curl -sf "http://localhost:$PROXY_PORT/" > /dev/null 2>&1; then
        echo "❌ Reverse proxy unresponsive on port $PROXY_PORT! Restarting..."
        exit 1
    fi

    # Check TTS server
    if ! kill -0 $TTS_PID 2>/dev/null; then
        echo "❌ TTS server died! Restarting..."
        exit 1
    fi
    if ! curl -sf "http://localhost:$TTS_PORT/" > /dev/null 2>&1; then
        echo "❌ TTS server unresponsive! Restarting..."
        exit 1
    fi

    # Check web app (port-based — catches hung/dead processes)
    if ! kill -0 $APP_PID 2>/dev/null; then
        echo "❌ Web app died (PID gone)! Restarting..."
        exit 1
    fi
    if ! curl -sf "http://localhost:$APP_PORT/" > /dev/null 2>&1; then
        echo "❌ Web app unresponsive on port $APP_PORT! Restarting..."
        exit 1
    fi

    # Check backend
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Sync backend died! Restarting..."
        exit 1
    fi
    if ! curl -sf "http://localhost:$BACKEND_PORT/" > /dev/null 2>&1; then
        echo "❌ Sync backend unresponsive on port $BACKEND_PORT! Restarting..."
        exit 1
    fi
done
