import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3002,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
