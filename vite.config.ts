import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for TS2580: Cannot find name 'process' in the Node environment during config execution
declare var process: any;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Shim process.env.API_KEY to be available in the browser
    // This allows the app to use the key provided by Vercel environment variables
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  resolve: {
    // CRITICAL: This prevents the "useRef" null error by forcing 
    // all dependencies to use the same React instance.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  }
});