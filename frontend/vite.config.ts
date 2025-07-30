import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      "617d6955-e336-447e-9336-782340268964.preview.emergentagent.com"
    ]
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
