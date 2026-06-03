import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
const base = process.env.GH_PAGES ? '/nihongo-master/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['fedora-nuc.tailc24d36.ts.net'],
    proxy: {
      '/api/ollama': {
        target: 'http://100.84.210.83:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '/api'),
      },
      // Sync backend endpoints — proxy to FastAPI so dev mode also works
      '/progress': {
        target: 'http://localhost:9001',
        changeOrigin: true,
      },
      '/config': {
        target: 'http://localhost:9001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:9001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['fedora-nuc', 'fedora-nuc.tailc24d36.ts.net', '.tailc24d36.ts.net', '.local'],
  },
});
