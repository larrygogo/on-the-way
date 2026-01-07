import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 3001,
    open: true,
    strictPort: false // 如果端口被占用，自动尝试下一个可用端口
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
