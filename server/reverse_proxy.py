#!/usr/bin/env python3
"""
Simple reverse proxy for Nihongo Master on the NUC.
Routes /api/* → :9001, TTS paths → :8001, everything else → frontend :3000.
No root needed — runs on port 8080.
"""
import http.server
import urllib.request
import urllib.error
import sys
import os
import signal

FRONTEND = "http://127.0.0.1:3000"
BACKEND = "http://127.0.0.1:9001"
TTS = "http://127.0.0.1:8001"
PORT = int(os.environ.get("PROXY_PORT", "8080"))


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self._proxy("GET")

    def do_PUT(self):
        self._proxy("PUT")

    def do_POST(self):
        self._proxy("POST")

    def _proxy(self, method):
        path = self.path

        # Route /api/* → backend (strip /api prefix)
        if path.startswith("/api/"):
            target = BACKEND + path[4:]
        elif path.startswith("/api"):
            target = BACKEND + path[3:]
        # Route TTS paths → TTS server
        elif path.startswith("/tts") or path.startswith("/audio/") or path.startswith("/voices"):
            target = TTS + path
        # Everything else → frontend
        else:
            target = FRONTEND + path

        # Read body if present
        body = None
        length = self.headers.get("Content-Length")
        if length:
            body = self.rfile.read(int(length))

        # Forward headers (skip host and connection)
        headers = {}
        for k, v in self.headers.items():
            k_lower = k.lower()
            if k_lower not in ("host", "connection", "transfer-encoding", "accept-encoding"):
                headers[k] = v
        headers["X-Forwarded-Host"] = self.headers.get("Host", "localhost")

        try:
            req = urllib.request.Request(target, data=body, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=30) as resp:
                self.send_response(resp.status)
                # Forward response headers
                for k, v in resp.headers.items():
                    k_lower = k.lower()
                    if k_lower not in ("transfer-encoding", "content-encoding", "content-length"):
                        self.send_header(k, v)
                content = resp.read()
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            try:
                content = e.read()
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except Exception:
                self.end_headers()
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"Proxy error: {e}".encode())

    def log_message(self, format, *args):
        try:
            if len(args) >= 3:
                sys.stderr.write(f"[PROXY] {args[0]} {args[1]} {args[2]}\n")
            else:
                sys.stderr.write(f"[PROXY] {format % args if args else format}\n")
        except Exception:
            pass


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), ProxyHandler)
    print(f"🚀 Reverse proxy listening on 0.0.0.0:{PORT}", flush=True)
    print(f"   Frontend :3000 ← / (and others)", flush=True)
    print(f"   Backend  :9001 ← /api/*", flush=True)
    print(f"   TTS      :8001 ← /tts /audio/ /voices", flush=True)

    def shutdown(sig, frame):
        print("\nShutting down...", flush=True)
        server.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
