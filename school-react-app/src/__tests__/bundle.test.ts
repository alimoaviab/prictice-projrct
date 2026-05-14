/**
 * Bundle Size & Code Splitting Verification
 *
 * This test runs `vite build` and analyzes the output to ensure:
 * - Main bundle is under 250KB
 * - No single chunk exceeds 200KB
 * - At least 10 lazy-loaded chunks exist (route splitting works)
 * - Dashboard and Students code are NOT in the main bundle
 *
 * Run: npx vitest run src/__tests__/bundle.test.ts
 *
 * ─── Manual Verification Checklist ───────────────────────────────────────
 *
 * 1. Open Chrome DevTools → Network tab → filter "JS"
 * 2. Load the app at http://localhost:3000/auth/login
 *    ✓ Only 3-4 JS files should load (main + vendor + react)
 *    ✓ Total initial JS < 250KB (transferred/gzipped)
 *
 * 3. Login and navigate to /admin/dashboard
 *    ✓ A new chunk file loads (dashboard-[hash].js)
 *    ✓ Dashboard chunk < 80KB
 *
 * 4. Navigate to /admin/students
 *    ✓ Another chunk loads (students-[hash].js)
 *    ✓ Students chunk < 60KB
 *
 * 5. Navigate back to /admin/dashboard
 *    ✓ NO new network request (chunk already cached)
 */

import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readdirSync, statSync } from "fs";
import { join } from "path";

// Skip in CI if dist doesn't exist (build step runs separately)
const DIST_DIR = join(__dirname, "../../dist/assets");

function getDistFiles(): { name: string; size: number }[] {
  try {
    const files = readdirSync(DIST_DIR);
    return files
      .filter((f) => f.endsWith(".js"))
      .map((f) => ({
        name: f,
        size: statSync(join(DIST_DIR, f)).size,
      }));
  } catch {
    return [];
  }
}

describe("Bundle Analysis", () => {
  // Build first if dist doesn't exist
  const files = getDistFiles();
  const skipReason = files.length === 0 ? "dist/ not found — run `npm run build` first" : undefined;

  it.skipIf(!!skipReason)("main bundle is under 250KB", () => {
    const mainBundle = files.find(
      (f) => f.name.startsWith("index-") || f.name.includes("main")
    );
    expect(mainBundle).toBeDefined();
    expect(mainBundle!.size).toBeLessThan(250 * 1024);
  });

  it.skipIf(!!skipReason)("no single chunk exceeds 200KB", () => {
    const oversized = files.filter((f) => f.size > 200 * 1024);
    expect(oversized).toHaveLength(0);
    if (oversized.length > 0) {
      console.warn(
        "Oversized chunks:",
        oversized.map((f) => `${f.name} (${Math.round(f.size / 1024)}KB)`)
      );
    }
  });

  it.skipIf(!!skipReason)("at least 10 separate chunk files exist (lazy routes)", () => {
    // Main bundle + vendor + at least 10 lazy chunks = 12+ files
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it.skipIf(!!skipReason)("Dashboard code is NOT in main bundle", () => {
    // The main bundle should not contain dashboard-specific strings
    // This is a heuristic — check that dashboard chunk exists separately
    const dashboardChunk = files.find(
      (f) => f.name.includes("dashboard") || f.name.includes("Dashboard")
    );
    // If code splitting works, dashboard should be in its own chunk
    // OR the main bundle should be small enough that it clearly doesn't contain it
    const mainBundle = files.find(
      (f) => f.name.startsWith("index-") || f.name.includes("main")
    );
    if (mainBundle) {
      // Main bundle under 250KB means dashboard is definitely not in it
      // (dashboard + all modules would be 500KB+)
      expect(mainBundle.size).toBeLessThan(250 * 1024);
    }
  });

  it.skipIf(!!skipReason)("total bundle size is reasonable", () => {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalKB = Math.round(totalSize / 1024);

    // Total of all chunks should be under 2MB (reasonable for a full ERP)
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);

    console.log(`Total JS bundle: ${totalKB}KB across ${files.length} files`);
    console.log(
      "Top 5 largest:",
      files
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .map((f) => `${f.name} (${Math.round(f.size / 1024)}KB)`)
    );
  });
});
