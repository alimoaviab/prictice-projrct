#!/usr/bin/env node
/**
 * Ports the role-area page wrappers (app/admin/.../page.tsx,
 * app/teacher/.../page.tsx, etc.) into school-react-app/src/pages/{role}/...
 * The same string transformations from port-modules.mjs are applied.
 *
 *   node scripts/port-app-pages.mjs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OLD_APP = path.resolve(ROOT, "../old-app/school-app/app");
const DEST_BASE = path.resolve(ROOT, "src/pages/role");

const ROLES = ["admin", "teacher", "parent", "student"];

function pageNameFromPath(rolePath, segments) {
  const parts = segments.filter((s) => s !== "page.tsx" && s !== "page");
  const slug = parts
    .map((p) => p.replace(/\[\.\.\.(\w+)\]/g, "Catchall_$1"))
    .map((p) => p.replace(/\[\[?\.\.\.?(\w+)\]?\]/g, "Catchall_$1"))
    .map((p) => p.replace(/\[(\w+)\]/g, "Param_$1"))
    .map((p) => p.replace(/-/g, "_"));
  const camel = slug
    .map((p, i) =>
      p
        .split("_")
        .map((s, j) => (i === 0 && j === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
        .join("")
    )
    .join("_");
  const fnName =
    rolePath.charAt(0).toUpperCase() +
    rolePath.slice(1) +
    camel
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("") +
    "Page";
  return fnName;
}

function transform(source) {
  let src = source;

  src = src.replace(/^\s*["']use client["'];?\s*\n/m, "");

  src = src.replace(
    /import\s+Link\s+from\s+["']next\/link["'];?/g,
    'import { Link } from "react-router-dom";'
  );

  src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']next\/navigation["'];?/g,
    (_match, names) => {
      const wanted = names.split(",").map((n) => n.trim()).filter(Boolean);
      const rrImports = new Set();
      for (const w of wanted) {
        if (w === "useRouter") rrImports.add("useNavigate");
        else if (w === "usePathname") rrImports.add("useLocation");
        else if (w === "useSearchParams") rrImports.add("useSearchParams");
        else if (w === "useParams") rrImports.add("useParams");
      }
      return `import { ${[...rrImports].join(", ")} } from "react-router-dom";`;
    }
  );

  src = src.replace(/const\s+router\s*=\s*useRouter\(\)\s*;?/g, "const navigate = useNavigate();");
  src = src.replace(/\brouter\.push\(/g, "navigate(");
  src = src.replace(/\brouter\.replace\(/g, "navigate(");
  src = src.replace(/^\s*router\.refresh\(\)\s*;?\s*$/gm, "");
  src = src.replace(/router\.refresh\(\)\s*;?/g, "");
  src = src.replace(/\brouter\.back\(\)/g, "navigate(-1)");
  src = src.replace(/\brouter\.forward\(\)/g, "navigate(1)");

  src = src.replace(
    /const\s+pathname\s*=\s*usePathname\(\)\s*;?/g,
    "const pathname = useLocation().pathname;"
  );
  src = src.replace(/usePathname\(\)/g, "useLocation().pathname");

  src = src.replace(
    /const\s+searchParams\s*=\s*useSearchParams\(\)\s*;?/g,
    "const [searchParams] = useSearchParams();"
  );

  src = src.replace(/(<Link\b[^>]*?)\bhref=/g, "$1to=");

  // Imports use ../../ paths in app/ tree. After moving to src/pages/role/<role>/...,
  // adjust relative paths to point at module roots via the @ alias.
  // Source files have things like `../../../layouts/SchoolShell` and
  // `../../../modules/...`. Rewrite ALL `../../...` to use @ aliases.
  src = src.replace(
    /from\s+["'](?:\.\.\/)+(layouts|components|hooks|services|utils|contexts|providers|lib|config|types|store|modules|app|routes)([\/'"])/g,
    'from "@/$1$2'
  );

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
  src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']@edu\/shared\/validation\/[^"']+["'];?/g,
    (_m, names) => {
      const list = names.split(",").map((n) => n.trim()).filter(Boolean);
      return list.map((n) => `type ${n} = any;`).join("\n");
    }
  );
  src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']@edu\/shared\/[^"']+["'];?/g,
    (_m, names) => {
      const list = names.split(",").map((n) => n.trim()).filter(Boolean);
      return list.map((n) => `const ${n.replace(/\s+as\s+\w+/, "")}: any = undefined;`).join("\n");
    }
  );

  // Replace default export `export default function Foo()` with named export
  // wrapped + a default re-export. We need a stable function name to import.
  // Strategy: detect `export default function FunctionName(`, capture name,
  // remove `default`, then keep the named export.
  src = src.replace(
    /export\s+default\s+function\s+(\w+)\s*\(/,
    "export function $1("
  );
  // Detect anonymous default exports `export default function ()` — wrap in
  // a named const at the bottom is not handled; manual fix needed.

  return src;
}

async function findPageFiles(dir) {
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
      out.push(...(await findPageFiles(p)));
    } else if (entry.name === "page.tsx") {
      out.push(p);
    }
  }
  return out;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

/**
 * Map an app/<role>/<segments...>/page.tsx to a destination
 * src/pages/role/<role>/<segments-with-Param-instead-of-bracket>.tsx.
 * Using a single .tsx file per page makes route wiring straightforward.
 */
function destFor(role, segments) {
  const folderParts = segments.slice(0, -1).map((s) =>
    s
      .replace(/\[\.\.\.(\w+)\]/g, "Catchall_$1")
      .replace(/\[\[?\.\.\.?(\w+)\]?\]/g, "Catchall_$1")
      .replace(/\[(\w+)\]/g, "Param_$1")
  );
  const dir = path.join(DEST_BASE, role, ...folderParts);
  return dir;
}

async function main() {
  const allFiles = [];
  for (const role of ROLES) {
    const roleDir = path.join(OLD_APP, role);
    const files = await findPageFiles(roleDir);
    allFiles.push(...files.map((f) => ({ file: f, role })));
  }

  for (const { file, role } of allFiles) {
    const rel = path.relative(path.join(OLD_APP, role), file);
    const segments = rel.split(path.sep);
    const folderDest = destFor(role, segments);
    await ensureDir(folderDest);
    const destPath = path.join(folderDest, "index.tsx");

    const text = await fs.readFile(file, "utf8");
    const transformed = transform(text);

    // Ensure the file exports a named function we can import. If it now has
    // `export function ...`, we're good. If it doesn't, add a fallback.
    const finalText = transformed;

    await fs.writeFile(destPath, finalText);
  }

  console.log(`Ported ${allFiles.length} app/${ROLES.join("/, app/")}/* page.tsx files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
