import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // Fast Refresh is enabled by default
  server: {
    hmr: {
      overlay: true, // Show error overlay on screen
    },
    watch: {
      usePolling: true, // Enable polling for file watching (needed for WSL)
      interval: 1000, // Poll interval in milliseconds
    },
  },
});
