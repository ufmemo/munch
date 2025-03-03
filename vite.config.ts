import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/packman/', // Add base URL for GitHub Pages
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
});
