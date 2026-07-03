import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5261",
        changeOrigin: true,
      },
      "/hubs": {
        target: "http://localhost:5261",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',  // Keep this as is
    sourcemap: false,
  },
  base: '/',  // Use absolute path (not './')
  test: {
    globals: true,
    environment: 'jsdom',
  },
});