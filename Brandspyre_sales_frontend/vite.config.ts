import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    watch: {
      ignored: [
        '**/dist/**',
        /\.(zip|tar\.gz|rar|7z)$/i,
        '*.zip',
        '**/*.zip',
        '**/*.tar.gz',
        '**/*.rar'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
