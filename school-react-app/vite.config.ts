import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

function sharedDataPlugin(): Plugin {
  const candidatePaths = [
    path.resolve(__dirname, "../data"),
    path.resolve(__dirname, "./src/data"),
    path.resolve(__dirname, "./data"),
  ];
  const sharedDataDir = candidatePaths.find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory()) || candidatePaths[1];

  return {
    name: "eduplexo-shared-data",
    configureServer(server) {
      server.middlewares.use("/data", (req, res, next) => {
        const requestPath = decodeURIComponent((req.url || "").split("?")[0] || "/");
        const filePath = path.normalize(path.join(sharedDataDir, requestPath));
        if (!filePath.startsWith(sharedDataDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next();
          return;
        }

        if (filePath.endsWith(".json")) res.setHeader("Content-Type", "application/json; charset=utf-8");
        fs.createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      const outputDir = path.resolve(__dirname, "dist/data");
      // In Docker, the shared ../data directory may not exist — skip gracefully.
      if (!fs.existsSync(sharedDataDir)) {
        return;
      }
      fs.rmSync(outputDir, { recursive: true, force: true });
      fs.cpSync(sharedDataDir, outputDir, { recursive: true });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "";

  return {
    plugins: [sharedDataPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "shared": path.resolve(__dirname, "./src/shared"),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 3000,
      host: "0.0.0.0",
      fs: {
        allow: [path.resolve(__dirname, ".."), path.resolve(__dirname, ".")],
      },
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
