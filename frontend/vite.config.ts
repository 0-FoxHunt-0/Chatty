import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/", // Explicitly set base path for deployment
  plugins: [react(), tailwindcss()], // Fast Refresh is enabled by default
  build: {
    outDir: "dist",
    // Ensure assets are properly referenced
    assetsDir: "assets",
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  server: {
    hmr: {
      overlay: true, // Show error overlay on screen
    },
    watch: {
      usePolling: true, // Enable polling for file watching (needed for WSL)
      interval: 1000, // Poll interval in milliseconds
    },
    // Proxy API requests to backend in development
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
