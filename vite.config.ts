import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['openclaw.tailc24d36.ts.net']
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['openclaw.tailc24d36.ts.net']
  }
})