import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const schoolApp = path.join(root, "school-react-app");
const require = createRequire(import.meta.url);
const ts = require(path.join(schoolApp, "node_modules/typescript"));

const syllabusDir = path.join(root, "data", "syllabus");
const logsDir = path.join(root, "migration-logs");
const seedDir = path.join(root, "scripts", "seeds");
const seedLibDir = path.join(seedDir, "lib");

const registryPath = path.join(schoolApp, "src", "data", "syllabus", "registry.ts");
const subjectsPath = path.join(
  schoolApp,
  "src",
  "pages",
  "role",
  "admin",
  "question-papers",
  "generate",
  "subjects.tsx",
);
const classesPath = path.join(
  schoolApp,
  "src",
  "pages",
  "role",
  "admin",
  "question-papers",
  "generate",
  "classes.tsx",
);

const moduleCache = new Map();

function resolveTsFile(baseDir, specifier) {
  if (!specifier.startsWith(".")) {
    return specifier;
  }

  const base = path.resolve(baseDir, specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  throw new Error(`Unable to resolve ${specifier} from ${baseDir}`);
}

function loadTsModule(filePath) {
  const resolved = path.resolve(filePath);
  if (moduleCache.has(resolved)) {
    return moduleCache.get(resolved).exports;
  }

  const source = fs.readFileSync(resolved, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: resolved,
  });

  const mod = { exports: {} };
  moduleCache.set(resolved, mod);
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      const aliasPath = path.join(schoolApp, "src", specifier.slice(2));
      return loadTsModule(resolveTsFile(path.dirname(aliasPath), aliasPath));
    }
    const target = resolveTsFile(path.dirname(resolved), specifier);
    if (path.isAbsolute(target)) {
      return loadTsModule(target);
    }
    return require(target);
  };

  const script = new vm.Script(outputText, { filename: resolved });
  const context = vm.createContext({
    require: localRequire,
    exports: mod.exports,
    module: mod,
    __filename: resolved,
    __dirname: path.dirname(resolved),
    console,
  });
  script.runInContext(context);
  return mod.exports;
}

function findLiteralAfterConst(source, name) {
  const marker = `const ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Could not find ${name}`);
  }
  const eq = source.indexOf("=", start);
  const open = source.slice(eq).search(/[\[{]/);
  if (open === -1) {
    throw new Error(`Could not find literal for ${name}`);
  }
  const literalStart = eq + open;
  const opener = source[literalStart];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = literalStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }
    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === opener) {
      depth += 1;
    } else if (ch === closer) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(literalStart, i + 1);
      }
    }
  }

  throw new Error(`Unclosed literal for ${name}`);
}

function evaluateLiteral(source, name) {
  const literal = findLiteralAfterConst(source, name);
  return vm.runInNewContext(`(${literal})`);
}

function slug(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function normalizeSyllabusId(id) {
  const key = String(id).toLowerCase();
  if (key.startsWith("afaq")) return "afaq";
  if (key.startsWith("oxford")) return "oxford";
  if (key.startsWith("gohar")) return "gohar";
  return "ptb";
}

function sourceIdFor(id) {
  if (id === "afaq") return "afaq-snc";
  if (id === "oxford") return "oxford-snc";
  if (id === "gohar") return "gohar-snc";
  return "ptb";
}

function uniqueByValue(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = String(value).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function normalizeUnits(units) {
  if (!Array.isArray(units)) return [];
  return units.map((unit, unitIndex) => {
    const unitId = String(unit.id || `unit-${unitIndex + 1}`);
    const chapters = Array.isArray(unit.chapters) ? unit.chapters : [];
    return {
      ...unit,
      id: unitId,
      title: unit.title || unit.name || `Unit ${unitIndex + 1}`,
      type: unit.type || "unit",
      chapters: chapters.map((chapter, chapterIndex) => ({
        ...chapter,
        id: String(chapter.id || `${unitId}-chapter-${chapterIndex + 1}`),
        code: String(chapter.code || `${unitIndex + 1}.${chapterIndex + 1}`),
        title: chapter.title || chapter.name || `Chapter ${chapterIndex + 1}`,
        type: chapter.type || "chapter",
      })),
    };
  });
}

function countChapters(units) {
  return units.reduce((total, unit) => total + (Array.isArray(unit.chapters) ? unit.chapters.length : 0), 0);
}

function lookupChapters(registry, sourceId, className, subjectName) {
  const classCandidates = uniqueByValue([
    className,
    className === "5TH" ? "FIVE" : "",
    className === "6TH" ? "SIX" : "",
    className === "7TH" ? "7TH" : "",
  ]);

  const subjectCandidates = uniqueByValue([
    subjectName,
    subjectName.toUpperCase(),
    subjectName.replace(/\s+\((SUN|IQBAL|SNC|AFAQ SNC|OXFORD SNC|Oxford SNC|SRM)[^)]+\)/gi, ""),
    subjectName.replace(/\s+\((SUN|IQBAL)\s+SERIES\)/gi, ""),
    subjectName.replace(/\s+\(NEW\)/gi, " New"),
    subjectName.replace(/\s+\(.*?\)/g, ""),
    subjectName.replace(/^COMPUTER Science/i, "Computer"),
    subjectName.replace(/^Computer Science/i, "Computer"),
    subjectName.replace(/^GENERAL SCIENCE/i, "General Science"),
    subjectName.replace(/^ENGLISH/i, "English"),
    subjectName.replace(/^MATHEMATICS/i, "Mathematics"),
    subjectName.includes("اسلامیات") ? "Islamiat" : "",
    subjectName.includes("اُردو") ? "Urdu" : "",
  ]);

  for (const cls of classCandidates) {
    for (const subj of subjectCandidates) {
      const units = registry.getSyllabusData(sourceId, cls, subj);
      if (units) {
        return normalizeUnits(units);
      }
    }
  }

  return [];
}

function extractRegistryKeys() {
  const source = fs.readFileSync(registryPath, "utf8");
  const keys = [];
  const pattern = /["']([^"']+\|[^"']+\|[^"']+)["']\s*:/g;
  let match;
  while ((match = pattern.exec(source))) {
    keys.push(match[1]);
  }
  return keys;
}

function buildQuestionTypes() {
  return [
    ["mcq", "MCQ", "objective"],
    ["tick_correct_spelling", "Tick Correct Spelling", "objective"],
    ["fill_in_the_blanks", "Fill In The Blanks", "objective"],
    ["match_columns", "Match Columns", "objective"],
    ["question_answers", "Question Answers", "written"],
    ["letters", "Letters", "written"],
    ["applications", "Applications", "written"],
    ["stories", "Stories", "written"],
    ["essays", "Essays", "written"],
    ["missing_letters", "Missing Letters", "language"],
    ["form_of_verbs", "Form Of Verbs", "language"],
    ["words_into_sentences", "Words Into Sentences", "language"],
    ["word_meaning", "Word Meaning", "language"],
    ["singular_plural", "Singular Plural", "language"],
    ["genders", "Genders", "language"],
    ["translate_into_urdu", "Translate Into Urdu", "language"],
    ["grammar", "Grammar", "language"],
    ["exercise", "Exercise", "practice"],
    ["additional_questions", "Additional Questions", "practice"],
  ].map(([id, label, category]) => ({
    id,
    label,
    category,
    defaultMarks: id === "mcq" || category === "objective" ? 1 : 2,
    aliases: [label, id.replace(/_/g, " ")],
  }));
}

function buildSeedFiles() {
  fs.mkdirSync(seedLibDir, { recursive: true });
  fs.writeFileSync(
    path.join(seedLibDir, "seed-syllabus.js"),
    `const fs = require("node:fs");\nconst path = require("node:path");\n\nfunction flattenSyllabus(syllabus) {\n  const rows = [];\n  for (const cls of syllabus.classes || []) {\n    for (const subject of cls.subjects || []) {\n      for (const unit of subject.chapters || []) {\n        for (const chapter of unit.chapters || []) {\n          rows.push({\n            syllabus: syllabus.id,\n            syllabusName: syllabus.name,\n            class: cls.name,\n            subject: subject.name,\n            unit: unit.title,\n            chapter: chapter.title,\n            chapterCode: chapter.code,\n            metadata: { class: cls.metadata, subject: subject.metadata, unit: unit.metadata, chapter },\n          });\n        }\n      }\n    }\n  }\n  return rows;\n}\n\nfunction seedSyllabusFromFile(filePath, options = {}) {\n  const syllabus = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));\n  const rows = flattenSyllabus(syllabus);\n  if (options.writeLog !== false) {\n    console.log(JSON.stringify({ syllabus: syllabus.id, classes: syllabus.classes.length, records: rows.length }, null, 2));\n  }\n  return rows;\n}\n\nmodule.exports = { flattenSyllabus, seedSyllabusFromFile };\n`,
  );

  for (const id of ["ptb", "afaq", "oxford", "gohar"]) {
    fs.writeFileSync(
      path.join(seedDir, `seed-${id}.js`),
      `const path = require("node:path");\nconst { seedSyllabusFromFile } = require("./lib/seed-syllabus");\n\nmodule.exports = function seed${id[0].toUpperCase()}${id.slice(1)}(options = {}) {\n  return seedSyllabusFromFile(path.join(__dirname, "..", "..", "data", "syllabus", "${id}.json"), options);\n};\n\nif (require.main === module) {\n  module.exports();\n}\n`,
    );
  }
}

function main() {
  fs.mkdirSync(syllabusDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
  fs.mkdirSync(seedDir, { recursive: true });

  const subjectsSource = fs.readFileSync(subjectsPath, "utf8");
  const classesSource = fs.readFileSync(classesPath, "utf8");
  const subjectsByClass = evaluateLiteral(subjectsSource, "subjectsByClass");
  const syllabusSpecificSubjects = evaluateLiteral(subjectsSource, "syllabusSpecificSubjects");
  const defaultClassOptions = evaluateLiteral(classesSource, "defaultClassOptions");
  const limitedClassOptions = evaluateLiteral(classesSource, "afaqClassOptions");
  const registry = loadTsModule(registryPath);
  const registryKeys = extractRegistryKeys();

  const syllabusConfigs = [
    { id: "ptb", name: "PTB", classOptions: defaultClassOptions },
    { id: "afaq", name: "AFAQ", classOptions: limitedClassOptions },
    { id: "oxford", name: "OXFORD", classOptions: limitedClassOptions },
    { id: "gohar", name: "GOHAR", classOptions: limitedClassOptions },
  ];

  const migration = {
    generatedBy: "scripts/generate-syllabus-config.mjs",
    source: {
      registry: path.relative(root, registryPath),
      subjects: path.relative(root, subjectsPath),
      classes: path.relative(root, classesPath),
      registryKeys: registryKeys.length,
    },
    syllabi: [],
  };

  for (const config of syllabusConfigs) {
    const sourceId = sourceIdFor(config.id);
    const subjectMap = config.id === "ptb" ? subjectsByClass : syllabusSpecificSubjects[sourceId] || {};

    const syllabus = {
      id: config.id,
      name: config.name,
      metadata: {
        sourceId,
        source: "legacy-typescript-registry",
        schemaVersion: 1,
      },
      classes: config.classOptions.map((className) => {
        const subjects = uniqueByValue(subjectMap[className] || []).map((subjectName) => {
          const chapters = lookupChapters(registry, sourceId, className, subjectName);
          return {
            id: `${slug(className)}-${slug(subjectName)}`,
            name: subjectName,
            metadata: {
              sourceSyllabus: sourceId,
              chapterGroups: chapters.length,
              chapterCount: countChapters(chapters),
            },
            chapters,
          };
        });

        return {
          id: slug(className),
          name: className,
          metadata: {
            sourceSyllabus: sourceId,
            subjects: subjects.length,
            chapterCount: subjects.reduce((total, subject) => total + subject.metadata.chapterCount, 0),
          },
          subjects,
        };
      }),
    };

    const totals = {
      id: config.id,
      classes: syllabus.classes.length,
      subjects: syllabus.classes.reduce((total, cls) => total + cls.subjects.length, 0),
      chapterGroups: syllabus.classes.reduce(
        (total, cls) => total + cls.subjects.reduce((inner, subject) => inner + subject.metadata.chapterGroups, 0),
        0,
      ),
      chapters: syllabus.classes.reduce(
        (total, cls) => total + cls.subjects.reduce((inner, subject) => inner + subject.metadata.chapterCount, 0),
        0,
      ),
    };

    migration.syllabi.push(totals);
    fs.writeFileSync(path.join(syllabusDir, `${config.id}.json`), `${JSON.stringify(syllabus, null, 2)}\n`);
  }

  fs.writeFileSync(path.join(root, "data", "question-types.json"), `${JSON.stringify({ questionTypes: buildQuestionTypes() }, null, 2)}\n`);
  fs.writeFileSync(path.join(logsDir, "syllabus-migration.json"), `${JSON.stringify(migration, null, 2)}\n`);
  buildSeedFiles();

  console.log(JSON.stringify(migration, null, 2));
}

main();
