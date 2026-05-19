"""
Nihongo Master Sync Backend
FastAPI + SQLite — stores learning progress and app config as JSON blobs.
Single-user, meant for tailnet access. No auth (relies on Tailscale network security).
"""

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = os.environ.get("NIHONGO_DB_PATH", os.path.expanduser("~/.local/share/nihongo-backend/progress.db"))
HOST = os.environ.get("NIHONGO_HOST", "127.0.0.1")
PORT = int(os.environ.get("NIHONGO_PORT", "9001"))


# ── Models ──────────────────────────────────────────────────────────────────

class ProgressPayload(BaseModel):
    data: dict  # raw JSON object — schema is owned by the frontend
    lastUpdated: str | None = None  # ISO-8601 timestamp


class ConfigPayload(BaseModel):
    data: dict
    lastUpdated: str | None = None


# ── DB setup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA synchronous=NORMAL")
        await db.execute(
            """CREATE TABLE IF NOT EXISTS store (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )"""
        )
        await db.commit()
        app.state.db = db
        yield


app = FastAPI(lifespan=lifespan, title="Nihongo Master Sync", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/progress")
async def get_progress():
    async with app.state.db.execute("SELECT value FROM store WHERE key='progress'") as cursor:
        row = await cursor.fetchone()
    if row is None:
        return {"data": {}, "lastUpdated": None}
    return json.loads(row[0])


@app.put("/progress")
async def put_progress(payload: ProgressPayload):
    now = datetime.now(timezone.utc).isoformat()
    wrapper = {"data": payload.data, "lastUpdated": now}
    async with app.state.db.execute("SELECT updated_at FROM store WHERE key='progress'") as cursor:
        existing = await cursor.fetchone()
    if existing and payload.lastUpdated and payload.lastUpdated < existing[0]:
        raise HTTPException(409, detail="Conflict: remote data is newer. Re-fetch and merge.")
    await app.state.db.execute(
        "INSERT INTO store(key, value, updated_at) VALUES('progress', ?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
        (json.dumps(wrapper, ensure_ascii=False), now),
    )
    await app.state.db.commit()
    return {"ok": True, "lastUpdated": now}


@app.get("/config")
async def get_config():
    async with app.state.db.execute("SELECT value FROM store WHERE key='config'") as cursor:
        row = await cursor.fetchone()
    if row is None:
        return {"data": {}, "lastUpdated": None}
    return json.loads(row[0])


@app.put("/config")
async def put_config(payload: ConfigPayload):
    now = datetime.now(timezone.utc).isoformat()
    wrapper = {"data": payload.data, "lastUpdated": now}
    async with app.state.db.execute("SELECT updated_at FROM store WHERE key='config'") as cursor:
        existing = await cursor.fetchone()
    if existing and payload.lastUpdated and payload.lastUpdated < existing[0]:
        raise HTTPException(409, detail="Conflict: remote data is newer. Re-fetch and merge.")
    await app.state.db.execute(
        "INSERT INTO store(key, value, updated_at) VALUES('config', ?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
        (json.dumps(wrapper, ensure_ascii=False), now),
    )
    await app.state.db.commit()
    return {"ok": True, "lastUpdated": now}


# ── CLI runner ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, log_level="info")
