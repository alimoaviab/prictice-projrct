#!/usr/bin/env node

const { spawnSync } = require("child_process");
const { log, okStatus, request } = require("./test-utils");

const pageRoutes = [
  "/admin/dashboard",
  "/admin/academy-care",
  "/admin/academic-years",
  "/admin/classes",
  "/admin/teachers",
  "/admin/students",
  "/admin/attendance",
  "/admin/homework",
  "/admin/exams",
  "/admin/results",
  "/admin/settings"
];

async function testPageRoutes() {
  log("blue", "\nPAGE ROUTES\n");
  let passed = 0;

  for (const route of pageRoutes) {
    const response = await request(route);
    const success = okStatus(response.status);
    log(success ? "green" : "red", `${success ? "✓" : "✗"} ${route} (${response.status})`);
    if (success) {
      passed += 1;
    }
  }

  return { passed, total: pageRoutes.length };
}

function runScript(label, fileName) {
  log("blue", `\nRUNNING ${label.toUpperCase()}\n`);
  const result = spawnSync(process.execPath, [fileName], { stdio: "inherit", cwd: __dirname });
  if (result.status !== 0) {
    throw new Error(`${label} script failed`);
  }
}

async function run() {
  const pageSummary = await testPageRoutes();

  runScript("settings", "./test-settings.js");
  runScript("exams", "./test-exams.js");
  runScript("results", "./test-results.js");

  log("cyan", `\nPAGE SUMMARY: ${pageSummary.passed}/${pageSummary.total} passed\n`);
}

run().catch((error) => {
  log("red", `Aggregate test failed: ${error.message}`);
  process.exit(1);
});
