#!/usr/bin/env node

const { ensureClass, log, okStatus, request } = require("./test-utils");

async function run() {
  log("cyan", "\nEXAMS TEST\n");
  const classroom = await ensureClass();

  const page = await request("/admin/exams");
  log(okStatus(page.status) ? "green" : "red", `${okStatus(page.status) ? "✓" : "✗"} /admin/exams (${page.status})`);

  const load = await request("/api/exams");
  log(okStatus(load.status) && load.data?.ok ? "green" : "red", `${okStatus(load.status) && load.data?.ok ? "✓" : "✗"} GET /api/exams (${load.status})`);
  if (!load.data?.ok) {
    throw new Error(load.data?.error?.message || "Failed to load exams");
  }

  const createdPayload = {
    class_id: classroom._id,
    subject: "Science",
    title: "Unit Test Exam",
    starts_at: "2024-11-20",
    max_marks: 50,
    status: "scheduled",
    description: "Created from automated test"
  };

  const save = await request("/api/exams", "POST", createdPayload);
  log(okStatus(save.status) && save.data?.ok ? "green" : "red", `${okStatus(save.status) && save.data?.ok ? "✓" : "✗"} POST /api/exams (${save.status})`);
  if (!save.data?.ok) {
    throw new Error(save.data?.error?.message || "Failed to save exam");
  }

  const verify = await request("/api/exams");
  const verified = okStatus(verify.status) && verify.data?.ok && verify.data.data.some((row) => row.title === "Unit Test Exam");
  log(verified ? "green" : "red", `${verified ? "✓" : "✗"} Verified exam save`);

  if (!verified) {
    throw new Error("Exam record was not persisted.");
  }

  log("green", "Exams test passed\n");
}

run().catch((error) => {
  log("red", `Exams test failed: ${error.message}`);
  process.exit(1);
});