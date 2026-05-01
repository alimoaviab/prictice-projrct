#!/usr/bin/env node

const { ensureExam, ensureStudent, log, okStatus, request } = require("./test-utils");

async function run() {
  log("cyan", "\nRESULTS TEST\n");
  const exam = await ensureExam();
  const studentList = await request("/api/students");
  let student =
    studentList.ok && studentList.data?.ok && Array.isArray(studentList.data.data)
      ? studentList.data.data.find((row) => String(row.class_id) === String(exam.class_id)) || null
      : null;

  if (!student) {
    const createdStudent = await request("/api/students", "POST", {
      admission_no: `ADM-R-${Date.now()}`,
      first_name: "Result",
      last_name: "Check",
      class_id: exam.class_id,
      section: "B",
      guardian: {
        name: "Result Guardian",
        phone: "4444444444",
        email: "result-check.guardian@test.local"
      }
    });

    if (!okStatus(createdStudent.status) || !createdStudent.data?.ok) {
      throw new Error(createdStudent.data?.error?.message || "Failed to create class-matched student");
    }

    student = createdStudent.data.data;
  }

  const page = await request("/admin/results");
  log(okStatus(page.status) ? "green" : "red", `${okStatus(page.status) ? "✓" : "✗"} /admin/results (${page.status})`);

  const load = await request("/api/results");
  log(okStatus(load.status) && load.data?.ok ? "green" : "red", `${okStatus(load.status) && load.data?.ok ? "✓" : "✗"} GET /api/results (${load.status})`);
  if (!load.data?.ok) {
    throw new Error(load.data?.error?.message || "Failed to load results");
  }

  const createdPayload = {
    exam_id: exam._id,
    student_id: student._id,
    obtained_marks: 91,
    grade: "A+",
    remarks: "Created from automated test"
  };

  const save = await request("/api/results", "POST", createdPayload);
  log(okStatus(save.status) && save.data?.ok ? "green" : "red", `${okStatus(save.status) && save.data?.ok ? "✓" : "✗"} POST /api/results (${save.status})`);
  if (!save.data?.ok) {
    throw new Error(save.data?.error?.message || "Failed to save result");
  }

  const verify = await request("/api/results");
  const verified =
    okStatus(verify.status) &&
    verify.data?.ok &&
    verify.data.data.some(
      (row) => row.exam_title === exam.title || String(row.student_name || "").includes(student.first_name)
    );
  log(verified ? "green" : "red", `${verified ? "✓" : "✗"} Verified result save`);

  if (!verified) {
    throw new Error("Result record was not persisted.");
  }

  log("green", "Results test passed\n");
}

run().catch((error) => {
  log("red", `Results test failed: ${error.message}`);
  process.exit(1);
});