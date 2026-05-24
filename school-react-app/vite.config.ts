import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "shared": path.resolve(__dirname, "./src/shared"),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 3000,
      host: "0.0.0.0",
      // When VITE_API_PROXY_TARGET is set (e.g. http://localhost:8080), Vite
      // forwards every /api/* request to the future Go backend. When unset,
      // requests fall through to MSW which serves mock responses in-browser.
      proxy: {
        ...(apiTarget
          ? {
            "/api": {
              target: apiTarget,
              changeOrigin: true,
              secure: false,
            },
          }
          : {}),
        // Plexa chatbot service (always proxied to FastAPI on :8001)
        "/chat": {
          target: env.VITE_EDUBOT_URL || "http://localhost:8001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
