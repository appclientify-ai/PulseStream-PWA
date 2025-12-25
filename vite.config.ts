
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available. We define it manually.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Use the manually defined __dirname to resolve index.html
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Socket.IO
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
