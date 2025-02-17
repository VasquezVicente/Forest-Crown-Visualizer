import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/Forest-Crown-Visualizer/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets', // Explicit assets directory
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]' // Ensure proper asset paths
        }
      }
    },
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      }
    },

    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    }
  };
});