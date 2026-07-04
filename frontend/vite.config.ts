import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "echarts": ["echarts", "echarts-for-react"],
          "radix": [
            "@radix-ui/react-tabs",
            "@radix-ui/react-dialog",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-avatar",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
          ],
        },
      },
    },
  },
})
