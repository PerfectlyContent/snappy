import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3001',
      '/classify': 'http://localhost:3001',
      '/calendar': 'http://localhost:3001',
      '/drive': 'http://localhost:3001',
      '/contacts': 'http://localhost:3001',
      '/share': 'http://localhost:3001',
      '/snap': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
