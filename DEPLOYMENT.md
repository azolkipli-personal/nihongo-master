# Nihongo Master — Deployment & Infrastructure

## Architecture Overview

```
                    Tailscale Serve (HTTPS)
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
    :9443             :9001              :10443
  (Frontend)      (Backend API)        (TTS API)
        │                 │                  │
        ▼                 ▼                  ▼
  127.0.0.1:3001   127.0.0.1:9001     127.0.0.1:8001
   (proxy.cjs)      (main.py)         (tts_server.py)
        │
        ├── API routes → :9001 (backend)
        └── Everything else → :3000 (Vite preview)
```

## Port Map

| Port  | Tailscale Serve           | Backend               | Service               |
| ----- | ------------------------- | --------------------- | --------------------- |
| 9443  | `:9443 → 127.0.0.1:3001`  | —                     | Frontend via proxy    |
| 9001  | `:9001 → 127.0.0.1:9001`  | `main.py` (FastAPI)   | Sync backend API      |
| 10443 | `:10443 → 127.0.0.1:8001` | `tts_server.py`       | Japanese TTS          |
| 3001  | —                         | `proxy.cjs` (Node.js) | Unified proxy         |
| 3000  | —                         | `vite preview`        | Frontend static files |

## Services

### 1. Frontend — Vite Preview (port 3000)

Serves the built React app. Preview mode, not dev server.

```bash
cd ~/Projects/nihongo-master
npm run preview -- --host 0.0.0.0 --port 3000
```

### 2. Proxy — proxy.cjs (port 3001)

Node.js http proxy that routes incoming requests:

- **API paths** (`/progress`, `/config`, `/health`) → `127.0.0.1:9001` (backend)
- **Everything else** → `127.0.0.1:3000` (frontend)

This allows Tailscale Serve to point at a single port (`:3001`) for both frontend and API.

```bash
node server/proxy.cjs
```

Location: `~/Projects/nihongo-master/server/proxy.cjs`

### 3. Backend — main.py (port 9001)

FastAPI + SQLite server for syncing learning progress and config.

**⚠️ CRITICAL:** Must bind to `127.0.0.1` only, not `0.0.0.0`.

```bash
cd ~/Projects/nihongo-master
NIHONGO_HOST=127.0.0.1 python3 server/main.py
```

**Why:** Tailscale Serve owns the `:9001` port at the Tailscale IP (`100.84.210.22:9001`). If main.py tries to bind to `0.0.0.0:9001`, it conflicts and silently fails to start — resulting in 502 errors on API calls.

The `NIHONGO_HOST=127.0.0.1` env var tells Uvicorn to bind only to localhost, avoiding the conflict.

Configuration via env vars:

- `NIHONGO_HOST` — bind address (default `0.0.0.0`, **must override to `127.0.0.1`**)
- `NIHONGO_PORT` — listen port (default `9001`)
- `NIHONGO_DB_PATH` — SQLite database path (default `~/.local/share/nihongo-backend/progress.db`)

### 4. TTS Server — tts_server.py (port 8001)

Japanese text-to-speech server. Listens on `0.0.0.0:8001`.

Tailscale Serve maps `:10443 → 127.0.0.1:8001` for TLS access.

## Tailscale Serve Config

```
https://fedora-nuc.tailc24d36.ts.net:9443  → 127.0.0.1:3001   (Frontend + API)
https://fedora-nuc.tailc24d36.ts.net:9001  → 127.0.0.1:9001   (Backend API direct)
https://fedora-nuc.tailc24d36.ts.net:10443 → 127.0.0.1:8001   (TTS)
https://fedora-nuc.tailc24d36.ts.net       → 127.0.0.1:18789  (OpenClaw Gateway)
https://fedora-nuc.tailc24d36.ts.net:8443  → 127.0.0.1:18080  (Canvas app)
```

All are tailnet-only (not exposed to the public internet).

## Watchdog Script

Location: `~/Projects/nihongo-master/server/nihongo-watchdog.sh`

Starts all three services (TTS, backend, frontend) and health-checks them every 30s. If any process dies, the script exits with code 1 (relying on systemd `Restart=always` to restart the whole stack).

### To Do

- [ ] **Update watchdog** to pass `NIHONGO_HOST=127.0.0.1` when launching `main.py`
- [ ] **Update systemd service** (`nihongo-master-prod.service`) to launch the full stack instead of just the frontend

## Troubleshooting

### 502 on API calls (force push, progress sync)

The backend (`main.py`) is not running. Check:

```bash
curl http://127.0.0.1:9001/health
```

If connection refused:

1. Ensure `NIHONGO_HOST=127.0.0.1` is set (not `0.0.0.0`)
2. Port 9001 might be blocked by Tailscale Serve — check with `ss -tlnp | grep 9001`
3. Restart: `NIHONGO_HOST=127.0.0.1 python3 server/main.py &`

### Frontend inaccessible via :9443

Check the proxy:

```bash
curl http://127.0.0.1:3001/          # Should return HTML
curl http://127.0.0.1:3001/health    # Should return JSON
```

If 502, restart the Vite preview: `npm run preview -- --host 0.0.0.0 --port 3000 &`

## Common Commands

```bash
# Start full stack
cd ~/Projects/nihongo-master
nohup node server/proxy.cjs &
nohup python3 server/tts_server.py &
NIHONGO_HOST=127.0.0.1 nohup python3 server/main.py &
nohup npm run preview -- --host 0.0.0.0 --port 3000 &

# Check health
curl http://127.0.0.1:9001/health    # Backend
curl http://127.0.0.1:3001/          # Proxy

# View Tailscale Serve config
tailscale serve status
```
