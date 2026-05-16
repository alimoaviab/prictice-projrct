import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./app/globals.css";
import { router } from "@/routes";
import { env } from "@/config/env";

// CRITICAL: Handle "Failed to fetch dynamically imported module" errors gracefully.
// This happens when a new build is deployed and the browser tries to load a stale asset hash.
window.addEventListener("error", (event) => {
  if (event.message?.includes("Failed to fetch dynamically imported module") || 
      event.message?.includes("Importing a module script failed")) {
    window.location.reload();
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
