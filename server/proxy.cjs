#!/usr/bin/env node
/**
 * Nihongo Master Unified Proxy
 * Serves frontend (vite preview) + proxies API calls to sync backend.
 * Single port so browsers never deal with cross-origin.
 */
const http = require('http');

const VITE_PORT = 3005;
const API_PORT = 9001;
const PROXY_PORT = 3000;

function proxyTo(target, port, req, res) {
  const options = {
    hostname: '127.0.0.1',
    port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers },
  };
  // Remove hop-by-hop headers
  delete options.headers['connection'];
  delete options.headers['proxy-connection'];

  const pref = http.request(options, (targetRes) => {
    // Forward the response status and headers
    const body = [];
    targetRes.on('data', (chunk) => body.push(chunk));
    targetRes.on('end', () => {
      const raw = Buffer.concat(body);
      res.writeHead(targetRes.statusCode, targetRes.headers);
      res.end(raw);
    });
  });
  pref.on('error', () => {
    if (req.url.startsWith('/progress') || req.url.startsWith('/config') || req.url.startsWith('/health')) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable' }));
    } else {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Proxy error');
    }
  });
  req.pipe(pref);
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url.startsWith('/progress') || url.startsWith('/config') || url.startsWith('/health')) {
    proxyTo('127.0.0.1', API_PORT, req, res);
  } else {
    proxyTo('127.0.0.1', VITE_PORT, req, res);
  }
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`✅ Unified proxy: 127.0.0.1:${PROXY_PORT} → frontend:${VITE_PORT} | api:${API_PORT}`);
});
