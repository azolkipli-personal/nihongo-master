#!/usr/bin/env python3
"""
Nihongo Master TTS Server Configuration for Tailnet Access
Updated: 2026-02-14

This file configures the TTS server to be accessible
on the Tailnet network (100.84.210.0/24).
"""

# Configuration for Tailnet Deployment
TAILNET_CONFIG = {
    "host": "0.0.0.0",  # Bind to all interfaces for tailnet access
    "port": 8001,
    "tailnet_ip": "100.84.210.22",
    "accessible_from": [
        "100.84.210.0/24"  # Entire tailnet can access
    ]
}

# Service URLs for Tailnet
TAILNET_URLS = {
    "tts_server": "http://100.84.210.22:8001",
    "nihongo_master": "http://100.84.210.22:5173",
    "openclaw_gateway": "http://100.84.210.22:3000",
    "shared_data": "/home/azolkipli/clawd/shared-data"
}

# Setup Instructions
SETUP_INSTRUCTIONS = """
# Step 1: Ensure TTS server binds to 0.0.0.0
# File: nihongo-master/server/tts_server.py
# Line ~108: uvicorn.run(app, host="0.0.0.0", port=8001)
# Already configured!

# Step 2: Restart TTS server
cd ~/clawd/nihongo-master
python3 server/tts_server.py &

# Step 3: Test from any tailnet device
curl http://100.84.210.22:8001/

# Step 4: Verify audio access
curl -X POST http://100.84.210.22:8001/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "宜しいですか"}'

# Step 5: Access from another tailnet device
# Open browser: http://100.84.210.22:5173
"""

# Test endpoints
TEST_COMMANDS = {
    "health_check": "curl http://100.84.210.22:8001/",
    "tts_request": 'curl -X POST http://100.84.210.22:8001/tts -H "Content-Type: application/json" -d '\''{"text": "こんにちは"}\''' ,
    "web_ui": "Open http://100.84.210.22:5173",
    "shared_data": "ls -la /home/azolkipli/clawd/shared-data/"
}

if __name__ == "__main__":
    print("Nihongo Master Tailnet Configuration")
    print("=" * 50)
    print(f"TTS Server URL: {TAILNET_URLS['tts_server']}")
    print(f"Nihongo Master URL: {TAILNET_URLS['nihongo_master']}")
    print(f"Gateway URL: {TAILNET_URLS['openclaw_gateway']}")
    print()
    print("Setup Instructions:")
    print(SETUP_INSTRUCTIONS)