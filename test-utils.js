const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduplexo";
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-local-dev";
const SCHOOL_ID = process.env.TEST_SCHOOL_ID || "test-school-123";

const authToken = jwt.sign(
  {
    sub: "test-user-1",
    school_id: SCHOOL_ID,
    role: "admin",
    permissions: [],
    session_id: "test-session-1",
    app: "school",
    actor_email: "admin@test.local"
  },
  JWT_SECRET,
  { expiresIn: "8h" }
);

const authHeaders = {
  "Content-Type": "application/json",
  "x-school-id": SCHOOL_ID,
  Authorization: `Bearer ${authToken}`,
  Cookie: `session=${authToken}`
};

function log(color, message) {
  const codes = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
  };

  console.log(`${codes[color] || ""}${message}${codes.reset}`);
}

function request(path, method = "GET", body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { ...authHeaders, ...headers }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let data = raw;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            // Leave as raw text when the response is not JSON.
          }

          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            raw,
            data
          });
        });
      }
    );

    req.on("error", (error) => {
      resolve({ status: 0, error: error.message, raw: "", data: null });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function okStatus(status) {
  return status >= 200 && status < 400;
}

async function ensureSchoolProfile() {
  await mongoose.connect(MONGODB_URI, { dbName: "eduplexo" });

  const schoolSchema = new mongoose.Schema(
    {
      school_id: { type: String, required: true, unique: true, index: true },
      name: { type: String, required: true },
      code: { type: String, required: true, unique: true },
      logo_url: { type: String, default: "" },
      contact_email: { type: String, default: "" },
      contact_phone: { type: String, default: "" },
      address: { type: String, default: "" },
      established_year: Number,
      admin_profile: {
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" }
      }
    },
    { collection: "schools", versionKey: false }
  );

  const School = mongoose.models.TestSchool || mongoose.model("TestSchool", schoolSchema);
  const existing = await School.findOne({ school_id: SCHOOL_ID }).lean();
  if (existing) {
    return existing;
  }

  return School.create({
    school_id: SCHOOL_ID,
    name: "Test Academy",
    code: "TEST-001",
    contact_email: "info@test.local",
    contact_phone: "0000000000",
    address: "Test Campus",
    established_year: 2024,
    admin_profile: {
      name: "Test Principal",
      email: "principal@test.local",
      phone: "1111111111"
    }
  });
}

async function ensureAcademicYear() {
  const list = await request("/api/academic-years");
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    return list.data.data[0];
  }

  const created = await request("/api/academic-years", "POST", {
    year: "2024-2025",
    start_date: "2024-04-01",
    end_date: "2025-03-31",
    is_active: true,
    description: "Auto-seeded academic year for tests"
  });

  if (!okStatus(created.status) || !created.data?.ok) {
    throw new Error(created.data?.error?.message || "Failed to seed academic year");
  }

  return created.data.data;
}

async function ensureClass() {
  const list = await request("/api/classes");
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    return list.data.data[0];
  }

  const academicYear = await ensureAcademicYear();
  const created = await request("/api/classes", "POST", {
    name: "Test Class",
    academy_care_id: academicYear._id,
    teacher_ids: [],
    subjects: ["Math", "English"],
    room_number: "101",
    description: "Auto-seeded class for tests"
  });

  if (!okStatus(created.status) || !created.data?.ok) {
    throw new Error(created.data?.error?.message || "Failed to seed class");
  }

  return created.data.data;
}

async function ensureStudent() {
  const list = await request("/api/students");
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    return list.data.data[0];
  }

  const classroom = await ensureClass();
  const created = await request("/api/students", "POST", {
    admission_no: "ADM-001",
    first_name: "Test",
    last_name: "Student",
    class_id: classroom._id,
    section: "A",
    guardian: {
      name: "Test Guardian",
      phone: "2222222222",
      email: "guardian@test.local"
    }
  });

  if (!okStatus(created.status) || !created.data?.ok) {
    throw new Error(created.data?.error?.message || "Failed to seed student");
  }

  return created.data.data;
}

async function ensureExam() {
  const list = await request("/api/exams");
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    return list.data.data[0];
  }

  const classroom = await ensureClass();
  const created = await request("/api/exams", "POST", {
    class_id: classroom._id,
    subject: "Mathematics",
    title: "Mid Term Test",
    starts_at: "2024-10-15",
    max_marks: 100,
    status: "scheduled",
    description: "Auto-seeded exam for tests"
  });

  if (!okStatus(created.status) || !created.data?.ok) {
    throw new Error(created.data?.error?.message || "Failed to seed exam");
  }

  return created.data.data;
}

async function ensureResult() {
  const list = await request("/api/results");
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    return list.data.data[0];
  }

  const exam = await ensureExam();
  let student = null;
  const students = await request("/api/students");
  if (students.ok && students.data?.ok && Array.isArray(students.data.data)) {
    student = students.data.data.find((row) => String(row.class_id) === String(exam.class_id)) || null;
  }

  if (!student) {
    const created = await request("/api/students", "POST", {
      admission_no: `ADM-${Date.now()}`,
      first_name: "Result",
      last_name: "Student",
      class_id: exam.class_id,
      section: "A",
      guardian: {
        name: "Result Guardian",
        phone: "3333333333",
        email: "result.guardian@test.local"
      }
    });

    if (!okStatus(created.status) || !created.data?.ok) {
      throw new Error(created.data?.error?.message || "Failed to seed class-matched student");
    }

    student = created.data.data;
  }

  const created = await request("/api/results", "POST", {
    exam_id: exam._id,
    student_id: student._id,
    obtained_marks: 88,
    grade: "A",
    remarks: "Auto-seeded result for tests"
  });

  if (!okStatus(created.status) || !created.data?.ok) {
    throw new Error(created.data?.error?.message || "Failed to seed result");
  }

  return created.data.data;
}

module.exports = {
  BASE_URL,
  SCHOOL_ID,
  authHeaders,
  ensureAcademicYear,
  ensureClass,
  ensureExam,
  ensureResult,
  ensureSchoolProfile,
  ensureStudent,
  log,
  okStatus,
  request
};