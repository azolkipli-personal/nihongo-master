#!/usr/bin/env node
/**
 * Nihongo Master unified proxy.
 * Serves the frontend (vite preview on :3000) AND
 * proxies API paths (/progress, /config, /health) to the backend (:9001)
 * on a single port (:3001).
 *
 * Tailscale Serve :9443 → proxy :3001 → routes to :3000 or :9001
 */

const http = require('http');
const http2 = require('http2');

const FRONTEND_PORT = 3000;
const BACKEND_PORT = 9001;
const PROXY_PORT = 3001;

const API_PATHS = ['/progress', '/config', '/health'];

function proxyRequest(targetPort) {
  return (req, res) => {
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers },
    };

    // Remove hop-by-hop headers
    delete options.headers['connection'];
    delete options.headers['proxy-connection'];

    const proxyReq = http.request(options, (proxyRes) => {
      // Forward status and headers
      const statusCode = proxyRes.statusCode;
      const headers = { ...proxyRes.headers };
      res.writeHead(statusCode, headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`Proxy error to :${targetPort} for ${req.url}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end(`Bad Gateway: ${err.message}`);
      }
    });

    // Forward request body
    req.pipe(proxyReq);
  };
}

const server = http.createServer((req, res) => {
  const path = req.url || '/';

  // Route API paths to backend, everything else to frontend
  if (API_PATHS.some((p) => path.startsWith(p))) {
    proxyRequest(BACKEND_PORT)(req, res);
  } else {
    proxyRequest(FRONTEND_PORT)(req, res);
  }
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`🚀 Proxy listening on http://127.0.0.1:${PROXY_PORT}`);
  console.log(`   API paths (${API_PATHS.join(', ')}) → :${BACKEND_PORT}`);
  console.log(`   Everything else → :${FRONTEND_PORT}`);
});
