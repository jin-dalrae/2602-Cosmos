import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Force a single three.js instance — @react-three/xr's transitive deps
    // (@iwer/sem, @iwer/devui, stats-gl) bundle their own three otherwise.
    alias: {
      three: path.resolve(__dirname, 'node_modules/three'),
    },
    dedupe: ['three'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/xr'],
        },
      },
    },
  },
})
