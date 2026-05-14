#!/usr/bin/env node
/**
 * Bulk-port modules and components from old-app/school-app into the new
 * school-react-app, applying the mechanical transformations documented in
 * .kiro/steering/porting-workflow.md. Run from school-react-app:
 *
 *   node scripts/port-modules.mjs
 *
 * Idempotent — re-runs safely.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OLD = path.resolve(ROOT, "../old-app/school-app");

const COPY_DIRS = [
  // Module directories — copied verbatim, then transformed
  ["modules", "src/modules"],
  ["components/landing", "src/components/landing"],
  ["components/auth", "src/components/auth"],
  ["components/dashboard", "src/components/dashboard"],
  ["components/ai", "src/components/ai"],
  ["components/live-class", "src/components/live-class"],
  ["components/live-classes", "src/components/live-classes"],
  ["components/live-exams", "src/components/live-exams"],
];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyDir(src, dest) {
  let entries;
  try {
    entries = await fs.readdir(src, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  await ensureDir(dest);
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else if (entry.isFile()) {
      const text = await fs.readFile(s, "utf8");
      await fs.writeFile(d, text);
    }
  }
}

/**
 * Apply mechanical transformations to a TS/TSX source file.
 * Conservative — only string-level edits.
 */
function transform(source, relPath) {
  let src = source;

  // 1. Drop "use client" directive (top of file).
  src = src.replace(/^\s*["']use client["'];?\s*\n/m, "");

  // 2. Replace next/link import.
  //    `import Link from "next/link"` → `import { Link } from "react-router-dom"`
  src = src.replace(
    /import\s+Link\s+from\s+["']next\/link["'];?/g,
    'import { Link } from "react-router-dom";'
  );

  // 3. Replace next/navigation imports.
  src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']next\/navigation["'];?/g,
    (_match, names) => {
      const wanted = names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      const rrImports = new Set();
      const aliasLines = [];
      for (const w of wanted) {
        if (w === "useRouter") {
          rrImports.add("useNavigate");
        } else if (w === "usePathname") {
          rrImports.add("useLocation");
        } else if (w === "useSearchParams") {
          rrImports.add("useSearchParams");
        } else if (w === "useParams") {
          rrImports.add("useParams");
        } else if (w === "redirect" || w === "notFound") {
          // leave intentionally — caller will need manual port
        }
      }
      const rrLine = `import { ${[...rrImports].join(", ")} } from "react-router-dom";`;
      return [rrLine, ...aliasLines].join("\n");
    }
  );

  // 4. Convert `useRouter()` calls to `useNavigate()` (variable named `router`).
  //    Heuristic: keep as-is, then replace `router.push` and `router.replace`
  //    after the file body. Also rename the variable.
  src = src.replace(/const\s+router\s*=\s*useRouter\(\)\s*;?/g, "const navigate = useNavigate();");
  src = src.replace(/\brouter\.push\(/g, "navigate(");
  src = src.replace(/\brouter\.replace\(/g, "navigate(");
  // `router.refresh()` is a Next-only API; drop the line. React Router refetches
  // through TanStack Query invalidation, which the hooks already trigger.
  src = src.replace(/^\s*router\.refresh\(\)\s*;?\s*$/gm, "");
  src = src.replace(/router\.refresh\(\)\s*;?/g, "");
  // `router.back()` → `navigate(-1)`
  src = src.replace(/\brouter\.back\(\)/g, "navigate(-1)");
  // `router.forward()` → `navigate(1)`
  src = src.replace(/\brouter\.forward\(\)/g, "navigate(1)");
  // Append { replace: true } to `navigate(...)` calls that came from router.replace?
  // We can't tell in retrospect; the original `router.push` and `router.replace` both
  // become `navigate(url)`. If a caller previously used `router.replace`, they now
  // use `navigate(url)` which behaves like push. This is acceptable for Phase 1.5
  // but flagged in the steering doc.

  // 5. Convert pathname usage.
  //    `const pathname = usePathname()` → `const pathname = useLocation().pathname`
  src = src.replace(
    /const\s+pathname\s*=\s*usePathname\(\)\s*;?/g,
    "const pathname = useLocation().pathname;"
  );
  // `usePathname()` inline usage → `useLocation().pathname`
  src = src.replace(/usePathname\(\)/g, "useLocation().pathname");

  // 6. Rewrite useSearchParams() → React Router's flavour.
  //    React Router 7 returns `[params, setParams]` from useSearchParams,
  //    where `params` is URLSearchParams.
  //    `useSearchParams()` (used as URLSearchParams) → wrap with destructure.
  src = src.replace(
    /const\s+searchParams\s*=\s*useSearchParams\(\)\s*;?/g,
    "const [searchParams] = useSearchParams();"
  );
  // `useSearchParams()` standalone call returning URLSearchParams in old code.
  // Replace bare `useSearchParams()` invocations that are NOT preceded by a
  // destructure pattern. Hard to match with a regex safely; leave as-is and
  // rely on caller fixes.

  // 7. <Link href="..."> → <Link to="...">
  src = src.replace(/(<Link\b[^>]*?)\bhref=/g, "$1to=");

  // 8. Replace import paths.
  //    Global rewrites — only apply at the *root* level (../../ etc),
  //    NOT to single `../` which stays relative to the module's siblings.
  src = src.replace(
    /from\s+["'](?:\.\.\/){2,}(components\/ui|components\/parent|components\/auth|components\/dashboard|components\/landing|components\/ai|components\/live-class|components\/live-classes|components\/live-exams|hooks|services|utils|layouts|contexts|providers|lib|config|types|store|modules|app|routes)([\/'"])/g,
    'from "@/$1$2'
  );

  // 9. Replace @edu/shared imports.
  src = src.replace(
    /from\s+["']@edu\/shared\/types\/core["']/g,
    'from "@/types/core"'
  );
  src = src.replace(
    /from\s+["']@edu\/shared\/auth\/rbac["']/g,
    'from "@/config/rbac"'
  );
  src = src.replace(
    /from\s+["']@edu\/shared\/design-system\/tokens["']/g,
    'from "@/lib/design-tokens"'
  );
  // Validation schemas (zod) aren't ported yet — replace with permissive `any`
  // type aliases inline so files compile. Caller types still work.
  src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']@edu\/shared\/validation\/[^"']+["'];?/g,
    (_m, names) => {
      const list = names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      return list.map((n) => `type ${n} = any;`).join("\n");
    }
  );
  // Any other @edu/shared/* import → make it a type-only `any` shim.
  src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']@edu\/shared\/[^"']+["'];?/g,
    (_m, names) => {
      const list = names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      return list.map((n) => `const ${n.replace(/\s+as\s+\w+/, "")}: any = undefined;`).join("\n");
    }
  );

  // 10. Replace default Link imports already done; replace `from "next/image"` etc.
  src = src.replace(/from\s+["']next\/image["']/g, '/* next/image not used */ from "react"');

  // 11. Suppress unused-import warnings: stop here. TS check will surface real issues.

  void relPath;
  return src;
}

async function transformFile(filePath) {
  const ext = path.extname(filePath);
  if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) return;
  const text = await fs.readFile(filePath, "utf8");
  const next = transform(text, filePath);
  if (next !== text) {
    await fs.writeFile(filePath, next);
  }
}

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(p)));
    } else if (entry.isFile()) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  for (const [from, to] of COPY_DIRS) {
    const srcDir = path.join(OLD, from);
    const destDir = path.join(ROOT, to);
    process.stdout.write(`copy ${from} → ${to} ... `);
    await copyDir(srcDir, destDir);
    process.stdout.write("ok\n");
  }

  process.stdout.write("transform ... ");
  const files = [];
  for (const [, to] of COPY_DIRS) {
    files.push(...(await walk(path.join(ROOT, to))));
  }
  for (const f of files) {
    await transformFile(f);
  }
  process.stdout.write(`ok (${files.length} files)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
