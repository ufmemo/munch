import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@game': path.resolve(__dirname, './src/game'),
      '@components': path.resolve(__dirname, './src/game/components'),
      '@utils': path.resolve(__dirname, './src/game/utils'),
      '@state': path.resolve(__dirname, './src/game/state'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
})
