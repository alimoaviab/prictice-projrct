import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./app/globals.css";
import { router } from "@/routes";
import { env } from "@/config/env";

// ═══════════════════════════════════════════════════════════════════════════
// PERMANENT FIX: Handle "Failed to fetch dynamically imported module" errors.
//
// This happens when:
//   1. A new Docker build deploys (JS chunk hashes change)
//   2. Browser has cached the old index.html pointing to old chunk names
//   3. Browser tries to load old chunk → 404 → this error
//
// Solution: Detect the error and force a single page reload to get fresh HTML.
// We use sessionStorage to prevent infinite reload loops.
// ═══════════════════════════════════════════════════════════════════════════

const RELOAD_KEY = "__chunk_reload__";

function isChunkLoadError(message?: string): boolean {
  if (!message) return false;
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Unable to preload CSS") ||
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError")
  );
}

function handleChunkError() {
  const lastReload = sessionStorage.getItem(RELOAD_KEY);
  const now = Date.now();
  // Only reload once per 10 seconds to prevent infinite loops
  if (lastReload && now - parseInt(lastReload, 10) < 10000) {
    console.warn("[chunk-error] Already reloaded recently, not reloading again.");
    return;
  }
  sessionStorage.setItem(RELOAD_KEY, String(now));
  window.location.reload();
}

// Catch synchronous errors (e.g. from inline scripts)
window.addEventListener("error", (event) => {
  if (isChunkLoadError(event.message)) {
    event.preventDefault();
    handleChunkError();
  }
});

// Catch async errors from dynamic import() — this is the main one!
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || reason?.toString?.() || "";
  if (isChunkLoadError(message)) {
    event.preventDefault();
    handleChunkError();
  }
});

async function startMocksIfEnabled() {
  if (!env.enableMocks) return;
  try {
    const { worker } = await import("@/mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: { url: "/mockServiceWorker.js" },
    });
    // eslint-disable-next-line no-console
    console.info("[mocks] MSW worker started");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[mocks] MSW failed to start. Did you run `npm run msw:init`?",
      err
    );
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root element not found in index.html");
}
const root = createRoot(rootElement);

void startMocksIfEnabled().then(() => {
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
});
