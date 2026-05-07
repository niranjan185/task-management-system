import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "https://task-management-system-production-6619.up.railway.app",
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: "0.0.0.0",
    port: process.env.PORT || 8080,
    allowedHosts: ["refreshing-perfection-production-ebc7.up.railway.app"],
  },
});
