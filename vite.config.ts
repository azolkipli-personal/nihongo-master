import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['openclaw.tailc24d36.ts.net'],
    proxy: {
      '/api/ollama': {
        target: 'http://100.84.210.83:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '/api'),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['openclaw.tailc24d36.ts.net'],
  },
});
