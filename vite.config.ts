import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, './src/engine'),
      '@content': path.resolve(__dirname, './src/content'),
      '@gameplay': path.resolve(__dirname, './src/gameplay'),
      '@app': path.resolve(__dirname, './src/app')
    }
  }
});
