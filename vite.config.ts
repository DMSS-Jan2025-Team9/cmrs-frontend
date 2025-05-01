import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths({ root: __dirname }), react()],
  define: {
    // Fix for SockJS which expects global to be defined
    global: 'window',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ["antd"],
        },
      },
    },
  },
  server: {
    proxy: {
      // Proxy WebSocket requests
      '/ws': {
        target: 'http://localhost:8084',
        ws: true,
        changeOrigin: true,
      },
      // Proxy API requests
      '/api/notifications': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      }
    }
  }
});
