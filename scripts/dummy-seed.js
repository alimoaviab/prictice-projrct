#!/usr/bin/env node

/**
 * Eduplexo Custom Dummy Data Seeding Script (JS/Node version)
 *
 * Seeds:
 *  - 1 School registration: dummydata@gmail.com / test@1122
 *  - 10 Classes (Grade 1-A to Grade 10-A)
 *  - 50 Teachers (teacher@gmail.com / Test@123 as Class-1 incharge)
 *  - 1000 Students (100 per class, student@gmail.com / Test@123 in Class-1)
 *  - 15 Pending leave requests for Class-1 students (managed by teacher@gmail.com)
 *
 * Running:
 *   node scripts/dummy-seed.js
 */

const baseURL = process.env.BASE_URL || "http://localhost:8080";
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "super@gmail.com";
const superAdminPass = process.env.SUPER_ADMIN_PASS || "Test@123";
const schoolAdminEmail = "dummydata@gmail.com";
const schoolAdminPass = "test@1122";
const defaultPass = "Test@123";

const subjectsList = [
  "Mathematics", "English", "Science", "Urdu", "Islamic Studies",
  "Pakistan Studies", "Computer Science", "Physics", "Chemistry", "Biology"
];

const classGrades = [
  "Class-1", "Class-2", "Class-3", "Class-4", "Class-5",
  "Class-6", "Class-7", "Class-8", "Class-9", "Class-10"
];

const firstNames = [
  "Ali", "Ahmed", "Hassan", "Hussain", "Bilal", "Usman", "Omar", "Fahad",
  "Saad", "Awais", "Hamza", "Faizan", "Imran", "Tariq", "Junaid",
  "Sara", "Ayesha", "Fatima", "Maryam", "Hina", "Sana", "Zara", "Iqra",
  "Anum", "Samra", "Aliya", "Nida", "Saima", "Fariha", "Mahnoor"
];

const lastNames = [
  "Khan", "Ahmed", "Ali", "Malik", "Sheikh", "Qureshi", "Hussain",
  "Mahmood", "Iqbal", "Shah", "Raza", "Butt", "Nawaz", "Riaz",
  "Tariq", "Akhtar", "Yousaf", "Arshad", "Farooq", "Anwar"
];

const leaveTypes = ["Sick", "Casual", "Annual", "Emergency"];

let authToken = "";

async function apiCall(method, path, body = null) {
  const url = `${baseURL}${path}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return text;
  }

  if (response.status >= 400) {
    const errorMsg = json.message || (json.error && json.error.message) || text;
    throw new Error(`HTTP ${response.status}: ${errorMsg}`);
  }

  if (json.ok === false || json.success === false) {
    const errorMsg = json.message || (json.error && json.error.message) || "API Error";
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}

// Helper to choose random elements
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("=========================================================");
  console.log("    EDUPLEXO CUSTOM JS DUMMY DATA SEED SCRIPT");
  console.log("=========================================================");
  console.log(`Target API:    ${baseURL}`);
  console.log(`School Admin:  ${schoolAdminEmail}`);
  console.log("=========================================================");

  // 1. Login or Register the School
  try {
    await loginAsSchoolAdmin();
  } catch (err) {
    console.log(`School Admin login failed (${err.message}). Trying to register new school...`);
    try {
      await registerAndApproveSchool();
      await loginAsSchoolAdmin();
    } catch (regErr) {
      console.error(`Fatal error registering school: ${regErr.message}`);
      process.exit(1);
    }
  }

  // 2. Fetch active academic year
  let academicYearID;
  try {
    academicYearID = await getActiveAcademicYear();
    console.log(`✓ Active academic year found: ${academicYearID}`);
  } catch (err) {
    console.error(`Fatal: Failed to retrieve academic year: ${err.message}`);
    process.exit(1);
  }

  // 3. Create Subjects
  let subjects = [];
  try {
    subjects = await createSubjects();
  } catch (err) {
    console.error(`Fatal: Subject creation failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Create 50 Teachers
  let teachers = [];
  try {
    teachers = await createTeachers(subjects);
  } catch (err) {
    console.error(`Fatal: Teacher creation failed: ${err.message}`);
    process.exit(1);
  }

  // 5. Create 10 Classes
  let classes = [];
  try {
    classes = await createClasses(academicYearID, teachers, subjects);
  } catch (err) {
    console.error(`Fatal: Class creation failed: ${err.message}`);
    process.exit(1);
  }

  // 6. Create 1000 Students
  let class1Students = [];
  try {
    class1Students = await createStudents(classes);
  } catch (err) {
    console.error(`Fatal: Student creation failed: ${err.message}`);
    process.exit(1);
  }

  // 7. Create 15 Leave Requests for Class-1 students (assigned to teacher@gmail.com)
  try {
    await createLeaveRequests(class1Students);
  } catch (err) {
    console.error(`Fatal: Leave request creation failed: ${err.message}`);
    process.exit(1);
  }

  // 8. Seed Additional Portal Data for Admin, Teacher, and Student/Parent sidebars
  try {
    await seedSettings();
    await seedAttendance(class1Students);
    const { exams, tests } = await seedExamsAndTests(classes, subjects);
    await seedResults(exams, tests, class1Students);
    await seedHomework(classes, teachers, subjects);
    await seedBehavior(class1Students, teachers);
    await seedEvents();
    await seedLiveClasses(classes, teachers, subjects);
    await seedTimetables(classes, teachers, subjects);
    await seedFees(classes);
    await seedCertificates(class1Students);
    await seedAnnouncements();
    await seedChatMessages("dummydata@gmail.com", "teacher@gmail.com");
    await seedSchedules("teacher@gmail.com");
    await seedChaptersAndPapers(classes, teachers, subjects);
  } catch (err) {
    console.error(`Warning: An error occurred during extra data seeding: ${err.message}`);
  }

  console.log("=========================================================");
  console.log("    ✓ SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=========================================================");
  console.log("LOGIN CREDENTIALS FOR VERIFICATION:");
  console.log(`  School Admin:      ${schoolAdminEmail} / ${schoolAdminPass}`);
  console.log(`  Teacher Incharge:  teacher@gmail.com / ${defaultPass}`);
  console.log(`  Student/Parent:    student@gmail.com / ${defaultPass}`);
  console.log("=========================================================");
}

async function loginAsSchoolAdmin() {
  console.log(`→ Logging in as school admin: ${schoolAdminEmail}...`);
  const body = {
    email: schoolAdminEmail,
    password: schoolAdminPass,
    role: "admin",
  };
  const data = await apiCall("POST", "/api/auth/login", body);
  authToken = data.token;
  console.log("✓ Logged in as School Admin.");
}

async function registerAndApproveSchool() {
  console.log("→ Submitting school signup registration...");
  const body = {
    role: "admin",
    email: schoolAdminEmail,
    password: schoolAdminPass,
    fullName: "Dummy Admin",
    schoolName: "Dummy Data School",
    schoolCode: "DUMMY",
  };

  authToken = ""; // No token for signup
  try {
    await apiCall("POST", "/api/auth/signup", body);
    console.log("✓ School signup request submitted.");
  } catch (err) {
    if (err.message.includes("already registered") || err.message.includes("Conflict")) {
      console.log("⚠ Email already registered. Proceeding to approval check...");
    } else {
      throw err;
    }
  }

  // Log in as Super Admin
  console.log(`→ Logging in as Platform Super Admin (${superAdminEmail})...`);
  const superLoginBody = {
    email: superAdminEmail,
    password: superAdminPass,
    role: "admin",
  };
  const superData = await apiCall("POST", "/api/auth/login", superLoginBody);
  authToken = superData.token;
  console.log("✓ Logged in as Super Admin.");

  // Fetch schools list to get ID
  console.log("→ Searching for school registration ID...");
  const schoolsData = await apiCall("GET", "/api/super-admin/schools");
  const schoolsList = schoolsData.items || schoolsData;

  let targetSchoolID = "";
  for (const sch of schoolsList) {
    if (sch.email?.toLowerCase() === schoolAdminEmail.toLowerCase() || sch.code === "DUMMY") {
      targetSchoolID = sch._id || sch.school_id;
      break;
    }
  }

  if (!targetSchoolID) {
    throw new Error(`School with email ${schoolAdminEmail} not found in super admin list.`);
  }

  console.log(`Found school ID: ${targetSchoolID}. Sending approval request...`);
  await apiCall("POST", `/api/super-admin/schools/${targetSchoolID}/approve`);
  console.log("✓ School approved and activated.");
  authToken = ""; // Clear token
}

async function getActiveAcademicYear() {
  console.log("→ Fetching active academic year...");
  const years = await apiCall("GET", "/api/academic-years");
  const items = years.items || years;

  for (const y of items) {
    if (y.is_active || y.isActive) {
      return y._id;
    }
  }

  // If none is active, create one
  console.log("→ No active academic year found. Creating default year...");
  const currentYear = new Date().getFullYear();
  const body = {
    year: `${currentYear}-${currentYear + 1}`,
    start_date: `${currentYear}-04-01`,
    end_date: `${currentYear + 1}-03-31`,
    is_active: true,
  };
  const created = await apiCall("POST", "/api/academic-years", body);
  return created._id;
}

async function createSubjects() {
  console.log("→ Checking/Creating subjects...");
  const existing = await apiCall("GET", "/api/subjects");
  const existingList = existing.items || existing;
  const existingMap = new Map();
  for (const s of existingList) {
    existingMap.set(s.name.toLowerCase(), s._id);
  }

  const subjects = [];
  for (const name of subjectsList) {
    if (existingMap.has(name.toLowerCase())) {
      subjects.push({ _id: existingMap.get(name.toLowerCase()), name });
      continue;
    }

    let code = name.replace(/\s+/g, "").toUpperCase();
    if (code.length > 3) code = code.slice(0, 3);

    const body = {
      name,
      code,
      total_marks: 100,
      passing_marks: 40,
      status: "active",
    };

    try {
      const created = await apiCall("POST", "/api/subjects", body);
      subjects.push(created);
    } catch (err) {
      console.log(`  ⚠ Failed to create subject ${name}: ${err.message}`);
    }
  }
  console.log(`✓ Total subjects available: ${subjects.length}`);
  return subjects;
}

async function createTeachers(subjects) {
  console.log("→ Checking/Creating 50 teachers...");
  const existing = await apiCall("GET", "/api/teachers");
  const existingList = existing.items || existing.data || existing;
  const existingMap = new Map();
  for (const t of existingList) {
    existingMap.set(t.email.toLowerCase(), t);
  }

  const teachers = [];
  for (let i = 1; i <= 50; i++) {
    let email = `teacher${i}@gmail.com`;
    if (i === 1) email = "teacher@gmail.com";

    if (existingMap.has(email.toLowerCase())) {
      teachers.push(existingMap.get(email.toLowerCase()));
      continue;
    }

    let first = pickRandom(firstNames);
    let last = pickRandom(lastNames);
    if (i === 1) {
      first = "Teacher";
      last = "One";
    }

    // Assign 2-3 subjects
    const subjAssignments = [];
    for (let j = 0; j < 3; j++) {
      subjAssignments.push(pickRandom(subjects).name);
    }

    const body = {
      email,
      password: defaultPass,
      first_name: first,
      last_name: last,
      phone: `0300${String(1000000 + i).slice(1)}`,
      qualification: ["M.Ed", "B.Ed", "M.A", "M.Sc"][i % 4],
      subjects: subjAssignments,
      status: "active",
    };

    try {
      const created = await apiCall("POST", "/api/teachers", body);
      teachers.push(created);
    } catch (err) {
      console.log(`  ⚠ Failed to create teacher ${email}: ${err.message}`);
    }
  }
  console.log(`✓ Total teachers available: ${teachers.length}`);
  return teachers;
}

async function createClasses(yearID, teachers, subjects) {
  console.log("→ Checking/Creating 10 classes...");
  const existing = await apiCall("GET", "/api/classes");
  const existingList = existing.items || existing.data || existing;
  const existingMap = new Map();
  for (const c of existingList) {
    existingMap.set(c.name.toLowerCase(), c);
  }

  const classes = [];
  for (let i = 0; i < 10; i++) {
    const grade = classGrades[i % classGrades.length];
    const section = "A";
    const name = `${grade}-${section}`;

    if (existingMap.has(name.toLowerCase())) {
      classes.push(existingMap.get(name.toLowerCase()));
      continue;
    }

    // Teacher assignment
    let classTeacherID = "";
    const teacherIDs = [];

    if (i === 0) {
      // First class assigned to teacher@gmail.com (index 0)
      classTeacherID = teachers[0]._id;
      teacherIDs.push(teachers[0]._id);
    } else {
      classTeacherID = teachers[i % teachers.length]._id;
      teacherIDs.push(teachers[i % teachers.length]._id);
    }

    // Add 2 other random teachers
    for (let j = 0; j < 2; j++) {
      const randT = pickRandom(teachers)._id;
      if (randT !== classTeacherID && !teacherIDs.includes(randT)) {
        teacherIDs.push(randT);
      }
    }

    const subjectIDs = subjects.map(s => s._id);

    const body = {
      name,
      grade,
      section,
      capacity: 150,
      passing_percentage: 40,
      academic_year_id: yearID,
      class_teacher_id: classTeacherID,
      teacher_ids: teacherIDs,
      subject_ids: subjectIDs,
      room_number: String(101 + i),
    };

    try {
      const created = await apiCall("POST", "/api/classes", body);
      classes.push(created);
    } catch (err) {
      console.log(`  ⚠ Failed to create class ${name}: ${err.message}`);
    }
  }
  console.log(`✓ Total classes available: ${classes.length}`);
  return classes;
}

async function createStudents(classes) {
  console.log("→ Creating 100 students per class (total 1000)...");
  const existing = await apiCall("GET", "/api/students");
  const existingList = existing.items || existing.data || existing || [];
  console.log(`  [Debug] Existing students count: ${existingList.length}`);
  const existingMap = new Map();
  for (const s of existingList) {
    const email = s.email || (s.guardian && s.guardian.email);
    if (email) {
      existingMap.set(email.toLowerCase(), s);
    }
  }

  const students = [];
  const class1Students = [];

  for (let classIdx = 0; classIdx < classes.length; classIdx++) {
    const cls = classes[classIdx];
    console.log(`  ... processing class: ${cls.name}`);

    for (let studentIdx = 1; studentIdx <= 100; studentIdx++) {
      const rollNo = `R-${classIdx + 1}-${String(studentIdx).padStart(3, "0")}`;
      let email = `student_c${classIdx + 1}_${studentIdx}@gmail.com`;

      if (classIdx === 0 && studentIdx === 1) {
        email = "student@gmail.com";
      }

      if (existingMap.has(email.toLowerCase())) {
        const studentObj = existingMap.get(email.toLowerCase());
        students.push(studentObj);
        if (classIdx === 0) {
          class1Students.push(studentObj);
        }
        continue;
      }

      let first = pickRandom(firstNames);
      let last = pickRandom(lastNames);
      if (classIdx === 0 && studentIdx === 1) {
        first = "Student";
        last = "One";
      }

      const gender = studentIdx % 2 === 0 ? "female" : "male";

      const body = {
        email,
        password: defaultPass,
        first_name: first,
        last_name: last,
        class_id: cls._id,
        section: cls.section,
        roll_no: rollNo,
        gender,
        guardian: {
          name: `Guardian of ${first} ${last}`,
          phone: `0321${String(2000000 + classIdx * 100 + studentIdx).slice(1)}`,
          email: email,
        },
        status: "active",
      };

      try {
        const created = await apiCall("POST", "/api/students", body);
        students.push(created);
        if (classIdx === 0) {
          class1Students.push(created);
        }
      } catch (err) {
        console.log(`    ⚠ Failed to create student ${email}: ${err.message}`);
      }
    }
  }
  console.log(`✓ Seeded ${students.length} students total.`);
  return class1Students;
}

async function createLeaveRequests(class1Students) {
  console.log("→ Seeding pending leave requests for Class-1...");
  if (class1Students.length < 15) {
    console.log(`⚠ Found only ${class1Students.length} students in Class-1. Seeding leaves for all available.`);
  }

  // Fetch existing leaves
  let existingCount = 0;
  try {
    const existing = await apiCall("GET", "/api/leave");
    const existingList = existing.items || existing.data || existing;
    existingCount = existingList.length;
  } catch (err) {
    // Ignore and proceed
  }

  if (existingCount >= 15) {
    console.log(`✓ Existing leave records found (${existingCount}), skipping leave creation.`);
    return;
  }

  const now = new Date();
  const numToCreate = Math.min(15, class1Students.length);

  for (let i = 0; i < numToCreate; i++) {
    const student = class1Students[i];
    const startDate = new Date();
    startDate.setDate(now.getDate() + 1 + i);
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 1);

    const body = {
      requester_type: "student",
      requester_id: student._id || student.id,
      requester_name: `${student.first_name} ${student.last_name}`,
      class_id: student.class_id,
      leave_type: pickRandom(leaveTypes),
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      reason: "Important family event, please approve.",
      status: "pending",
    };

    try {
      await apiCall("POST", "/api/leave", body);
    } catch (err) {
      console.log(`  ⚠ Failed to create leave for ${student.email}: ${err.message}`);
    }
  }
  console.log(`✓ Created ${numToCreate} pending leave requests.`);
}

async function seedAttendance(students) {
  console.log("→ Seeding student attendance history (30 days)...");
  const statuses = ["present", "present", "present", "present", "absent", "late"];
  const now = new Date();
  let count = 0;
  
  // Seed attendance for students in Class-1-A (which are the class1Students)
  // Skip weekends to keep logs clean
  for (let d = 0; d < 30; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split("T")[0];
    
    // Sample a subset of students each day to populate dashboard reports
    const dayStudents = students.slice(0, 15);
    for (const student of dayStudents) {
      const body = {
        student_id: student._id || student.id,
        class_id: student.class_id,
        date: dateStr,
        status: pickRandom(statuses),
      };
      try {
        await apiCall("POST", "/api/attendance", body);
        count++;
      } catch (err) {
        console.log(`  ⚠ Attendance creation failed for student ${body.student_id}: ${err.message}`);
      }
    }
  }
  console.log(`✓ Seeded ${count} attendance records.`);
}

async function seedExamsAndTests(classes, subjects) {
  console.log("→ Seeding exams and tests...");
  const exams = [];
  const tests = [];
  const now = new Date();
  
  for (const cls of classes) {
    const classId = cls._id || cls.id;
    // Create Mid-Term and Final Exams
    for (const examType of ["Mid-Term", "Final"]) {
      const subj = pickRandom(subjects);
      const daysOffset = examType === "Mid-Term" ? -10 : 10;
      const startsAt = new Date(now);
      startsAt.setDate(now.getDate() + daysOffset);
      
      const body = {
        class_id: classId,
        subject: subj.name,
        title: `${examType} ${subj.name} - ${cls.name}`,
        starts_at: startsAt.toISOString().split("T")[0],
        max_marks: 100,
        description: `${examType} examination for ${subj.name}`,
      };
      try {
        const created = await apiCall("POST", "/api/exams", body);
        exams.push(created);
      } catch (err) {
        // ignore
      }
    }
    
    // Create 2 Tests per class
    const testTypes = ["Weekly Test", "Monthly Test", "Class Quiz"];
    for (let t = 0; t < 2; t++) {
      const subj = pickRandom(subjects);
      const testType = testTypes[t % testTypes.length];
      const startsAt = new Date(now);
      startsAt.setDate(now.getDate() - (t + 1) * 3); // past tests
      
      const body = {
        class_id: classId,
        subject: subj.name,
        title: `${testType} - ${subj.name} (${cls.name})`,
        starts_at: startsAt.toISOString().split("T")[0],
        max_marks: 50,
        description: `${testType} for ${subj.name}`,
      };
      try {
        const created = await apiCall("POST", "/api/tests", body);
        tests.push(created);
      } catch (err) {
        // ignore
      }
    }
  }
  
  console.log(`✓ Seeded ${exams.length} exams and ${tests.length} tests.`);
  return { exams, tests };
}

async function seedResults(exams, tests, class1Students) {
  console.log("→ Seeding result marks for Class-1-A...");
  let count = 0;
  
  const class1Id = class1Students[0].class_id;
  const filteredExams = exams.filter(e => (e.class_id || e.classId) === class1Id);
  const filteredTests = tests.filter(t => (t.class_id || t.classId) === class1Id);
  const targetStudents = class1Students.slice(0, 10);
  
  for (const exam of filteredExams) {
    const examId = exam._id || exam.id;
    for (const student of targetStudents) {
      const marks = 45 + Math.floor(Math.random() * 50); // 45 to 95
      const body = {
        exam_id: examId,
        student_id: student._id || student.id,
        obtained_marks: marks,
        remarks: marks > 80 ? "Excellent performance" : marks > 60 ? "Good job" : "Satisfactory",
      };
      try {
        await apiCall("POST", "/api/results", body);
        count++;
      } catch (err) {
        // ignore
      }
    }
  }
  
  for (const test of filteredTests) {
    const testId = test._id || test.id;
    for (const student of targetStudents) {
      const marks = 20 + Math.floor(Math.random() * 28); // 20 to 48 out of 50
      const body = {
        exam_id: testId,
        student_id: student._id || student.id,
        obtained_marks: marks,
        remarks: marks > 40 ? "Excellent" : marks > 30 ? "Good" : "Needs improvement",
      };
      try {
        await apiCall("POST", "/api/results", body);
        count++;
      } catch (err) {
        // ignore
      }
    }
  }
  
  console.log(`✓ Seeded ${count} student result grades.`);
}

async function seedHomework(classes, teachers, subjects) {
  console.log("→ Seeding homework assignments...");
  let count = 0;
  const now = new Date();
  
  for (const cls of classes) {
    const classId = cls._id || cls.id;
    for (let i = 1; i <= 3; i++) {
      const subj = pickRandom(subjects);
      const teacher = pickRandom(teachers);
      const daysOffset = i === 1 ? -3 : i === 2 ? 2 : 5;
      const dueAt = new Date(now);
      dueAt.setDate(now.getDate() + daysOffset);
      
      const body = {
        class_id: classId,
        teacher_id: teacher._id || teacher.id,
        subject: subj.name,
        subject_id: subj._id || subj.id,
        title: `${subj.name} Homework Assignment #${i}`,
        instructions: `Please complete the exercises from Chapter ${i} and submit before the deadline. Solve questions 1 to 10 on your notebooks.`,
        due_at: dueAt.toISOString().split("T")[0],
        status: "assigned",
      };
      try {
        await apiCall("POST", "/api/homework", body);
        count++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Seeded ${count} homework assignments.`);
}

async function seedBehavior(class1Students, teachers) {
  console.log("→ Seeding student behavior logs...");
  let count = 0;
  const targetStudents = class1Students.slice(0, 10);
  
  const behaviors = [
    { category: "conduct", description: "Arrived late to class multiple times this week.", severity: "medium", action: "Verbal warning given." },
    { category: "conduct", description: "Disrupted the class by talking repeatedly during lecture.", severity: "medium", action: "Spoke to student after class." },
    { category: "conduct", description: "Failed to submit mathematics homework twice consecutively.", severity: "low", action: "Warned student." },
    { category: "achievement", description: "Scored full marks in the weekly math quiz. Excellent preparation!", severity: "low", action: "Appreciated in class." },
    { category: "achievement", description: "Helped a peer understand a complex science topic during practical lab.", severity: "low", action: "Star student reward." },
  ];
  
  for (const student of targetStudents) {
    const bh = pickRandom(behaviors);
    const teacher = pickRandom(teachers);
    const body = {
      student_id: student._id || student.id,
      class_id: student.class_id,
      teacher_id: teacher._id || teacher.id,
      category: bh.category,
      incident_type: bh.category,
      description: bh.description,
      severity: bh.severity,
      action_taken: bh.action,
      status: "open",
      warning_count: 1,
      parent_notified: false,
    };
    try {
      await apiCall("POST", "/api/behavior", body);
      count++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${count} behavior records.`);
}

async function seedEvents() {
  console.log("→ Seeding school events...");
  const events = [
    { title: "Annual Sports Gala", type: "Sports", days: 7, location: "Main Sports Arena", desc: "Annual inter-house athletic competition and awards ceremony." },
    { title: "Parent-Teacher Meeting", type: "Meeting", days: 14, location: "Auditorium & Classrooms", desc: "Discuss academic progress and results with parents." },
    { title: "Science & Technology Fair", type: "Cultural", days: 10, location: "Exhibition Hall", desc: "Students display their science experiments and technical models." },
    { title: "Eid Mubarak Holidays", type: "Holiday", days: 20, location: "", desc: "School closed for Eid holidays." },
    { title: "Independence Day Celebration", type: "Holiday", days: 30, location: "Front Courtyard", desc: "Flag hoisting ceremony and national songs competition." },
  ];
  
  let count = 0;
  const now = new Date();
  for (const ev of events) {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + ev.days);
    const body = {
      title: ev.title,
      description: ev.desc,
      event_type: ev.type,
      start_date: startDate.toISOString().split("T")[0],
      end_date: startDate.toISOString().split("T")[0],
      location: ev.location,
      visibility: "all",
      status: "scheduled",
    };
    try {
      await apiCall("POST", "/api/events", body);
      count++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${count} events.`);
}

async function seedLiveClasses(classes, teachers, subjects) {
  console.log("→ Seeding live classes...");
  let count = 0;
  const now = new Date();
  
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const classId = cls._id || cls.id;
    const subj = subjects[i % subjects.length];
    const teacher = teachers[i % teachers.length];
    
    const startTime = new Date(now);
    startTime.setDate(now.getDate() + 2);
    startTime.setHours(9 + (i % 4), 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);
    
    const body = {
      class_id: classId,
      subject: subj.name,
      title: `${subj.name} Live Interactive Session`,
      starts_at: startTime.toISOString().replace(/\.\d+Z$/, ""),
      ends_at: endTime.toISOString().replace(/\.\d+Z$/, ""),
      host_teacher_id: teacher._id || teacher.id,
      provider: "jitsi",
      audience_type: "CLASS",
      status: "scheduled",
    };
    try {
      await apiCall("POST", "/api/live/classes/schedule", body);
      count++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${count} live classes.`);
}

async function seedTimetables(classes, teachers, subjects) {
  console.log("→ Seeding weekly timetables Mon-Fri...");
  let count = 0;
  
  const periodTimes = [
    { start: "08:00", end: "08:45" },
    { start: "08:45", end: "09:30" },
    { start: "09:30", end: "10:15" },
    { start: "10:30", end: "11:15" },
    { start: "11:15", end: "12:00" },
  ];
  
  const rooms = ["101", "102", "103", "104", "105", "201", "202", "203", "204", "205"];
  
  for (let classIdx = 0; classIdx < classes.length; classIdx++) {
    const cls = classes[classIdx];
    const classId = cls._id || cls.id;
    const classTeachers = teachers.slice(0, 10);
    
    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= 4; period++) {
        // Offset teacher index by classIdx to avoid scheduling conflicts (same teacher teaching multiple classes at the same period)
        const teacher = classTeachers[(day + period + classIdx) % classTeachers.length];
        const subj = subjects[(day * period) % subjects.length];
        
        const body = {
          class_id: classId,
          day_of_week: day,
          period_number: period,
          subject_id: subj._id || subj.id,
          subject: subj.name,
          teacher_id: teacher._id || teacher.id,
          start_time: periodTimes[period - 1].start,
          end_time: periodTimes[period - 1].end,
          room: pickRandom(rooms),
        };
        try {
          await apiCall("POST", "/api/timetable", body);
          count++;
        } catch (err) {
          console.log(`  ⚠ Timetable creation failed for class ${body.class_id}: ${err.message}`);
        }
      }
    }
  }
  console.log(`✓ Seeded ${count} weekly periods.`);
}

async function seedFees(classes) {
  console.log("→ Seeding fee structures...");
  
  const feeTypes = [
    { name: "Tuition Fee", category: "tuition", is_recurring: true },
    { name: "Transport Fee", category: "transport", is_recurring: true },
    { name: "Computer Lab Fee", category: "lab", is_recurring: true },
    { name: "Examination Fee", category: "exam", is_recurring: false }
  ];
  
  const savedFeeTypes = [];
  for (const ft of feeTypes) {
    const body = {
      name: ft.name,
      description: `${ft.name} structure`,
      is_recurring: ft.is_recurring,
      category: ft.category,
      status: "active"
    };
    try {
      const created = await apiCall("POST", "/api/fees/types", body);
      savedFeeTypes.push(created);
    } catch (err) {
      // ignore
    }
  }
  
  if (savedFeeTypes.length > 0) {
    for (const cls of classes) {
      const classId = cls._id || cls.id;
      const tuitionType = savedFeeTypes.find(t => t.category === "tuition") || savedFeeTypes[0];
      const tuitionBody = {
        fee_type_id: tuitionType._id || tuitionType.id,
        amount: 2500 + Math.floor(Math.random() * 20) * 100,
        type: "recurring",
        recurring_cycle: "monthly",
        status: "active"
      };
      try {
        await apiCall("POST", `/api/classes/${classId}/fees/components`, tuitionBody);
      } catch (err) {
        // ignore
      }
    }
  }
  
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  
  let count = 0;
  for (const cls of classes) {
    const classId = cls._id || cls.id;
    const generateBody = {
      class_id: classId,
      month: monthName,
      year: now.getFullYear()
    };
    try {
      await apiCall("POST", "/api/fees/generate", generateBody);
      count++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Generated monthly fees for ${count} classes (${monthName} ${now.getFullYear()}).`);

  // Fetch all generated invoices and record payments
  try {
    console.log("→ Fetching monthly invoices to record payments...");
    const invoicesData = await apiCall("GET", "/api/fees");
    const invoices = invoicesData.items || invoicesData.data || invoicesData || [];
    console.log(`✓ Found ${invoices.length} invoices.`);
    
    // Pay 15 invoices with different methods/amounts
    const payCount = Math.min(15, invoices.length);
    let successfulPayments = 0;
    for (let i = 0; i < payCount; i++) {
      const invoice = invoices[i];
      const invoiceId = invoice._id || invoice.id;
      const studentId = invoice.student_id;
      const effectiveAmount = invoice.effective_amount || invoice.amount || 2500;
      
      // Determine payment amount (some fully paid, some partial paid, some unpaid)
      let amountToPay = effectiveAmount;
      if (i % 3 === 1) {
        amountToPay = Math.round(effectiveAmount / 2); // partial payment
      } else if (i % 3 === 2) {
        amountToPay = 0; // unpaid (skip payment)
      }
      
      if (amountToPay > 0) {
        const paymentMethod = ["cash", "bank_transfer", "card"][i % 3];
        const body = {
          student_id: studentId,
          amount: amountToPay,
          method: paymentMethod,
          payment_method: paymentMethod,
          reference_no: `REF-${Date.now()}-${i}`,
          reference: `REF-${Date.now()}-${i}`,
          notes: i % 3 === 1 ? "Partial fee payment" : "Full fee payment",
          payment_date: now.toISOString().split("T")[0]
        };
        
        try {
          await apiCall("POST", `/api/fees/${invoiceId}/pay`, body);
          successfulPayments++;
        } catch (payErr) {
          console.log(`  ⚠ Failed to pay invoice ${invoiceId}: ${payErr.message}`);
        }
      }
    }
    console.log(`✓ Recorded ${successfulPayments} payments.`);
  } catch (err) {
    console.log(`  ⚠ Failed to record payments: ${err.message}`);
  }
}

async function seedCertificates(class1Students) {
  console.log("→ Seeding certificate templates...");
  
  const templates = [
    { name: "Character Certificate", type: "character", body: "This is to certify that the above named student has been a student of this school and has shown exemplary behavior and character during their study." },
    { name: "Merit Certificate", type: "merit", body: "This certificate is awarded to the student for securing outstanding marks and demonstrating exceptional academic skills." }
  ];
  
  const savedTemplates = [];
  for (const t of templates) {
    const body = {
      name: t.name,
      type: t.type,
      orientation: "landscape",
      body_text: t.body,
      elements: "[]",
      status: "active"
    };
    try {
      const created = await apiCall("POST", "/api/certificates/templates", body);
      savedTemplates.push(created);
    } catch (err) {
      // ignore
    }
  }
  
  if (savedTemplates.length > 0 && class1Students.length > 0) {
    const targetStudents = class1Students.slice(0, 3);
    for (const student of targetStudents) {
      const template = pickRandom(savedTemplates);
      const templateId = template._id || template.id;
      const body = {
        template_id: templateId,
        student_ids: [student._id || student.id]
      };
      try {
        await apiCall("POST", "/api/certificates/generate", body);
      } catch (err) {
        // ignore
      }
    }
    console.log(`✓ Issued certificates to ${targetStudents.length} students.`);
  }
}

async function seedAnnouncements() {
  console.log("→ Seeding announcements...");
  const announcements = [
    { title: "Summer Vacation Schedule", body: "School will remain closed for summer vacations from June 15th to August 14th. Reopening on August 15th.", audience: "all", priority: "high" },
    { title: "Mid-Term Exam Datesheet", body: "The Mid-Term exam datesheet is uploaded to the student and parent portal. Exams commence next Monday.", audience: "students", priority: "high" },
    { title: "Parent Teacher Meeting PTM", body: "PTM will be held on Saturday. Parents are requested to visit school between 9:00 AM to 1:00 PM to discuss results.", audience: "parents", priority: "normal" },
    { title: "Staff Meeting on Syllabus Coverage", body: "All teachers are requested to attend the syllabus alignment meeting in the Conference Room today at 2:00 PM.", audience: "teachers", priority: "high" }
  ];
  
  let count = 0;
  for (const a of announcements) {
    const body = {
      title: a.title,
      body: a.body,
      audience: a.audience,
      priority: a.priority
    };
    try {
      await apiCall("POST", "/api/announcements", body);
      count++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${count} announcements.`);
}

async function seedChatMessages(adminEmail, teacherEmail) {
  console.log("→ Seeding messaging conversations...");
  
  let teacherToken = "";
  let teacherUserId = "";
  try {
    const loginRes = await apiCall("POST", "/api/auth/login", {
      email: teacherEmail,
      password: defaultPass,
      role: "teacher"
    });
    teacherToken = loginRes.token;
    teacherUserId = loginRes.user_id;
  } catch (err) {
    console.log(`  ⚠ Failed to login as teacher for chat: ${err.message}`);
    return;
  }
  
  let adminToken = "";
  let adminUserId = "";
  try {
    const loginRes = await apiCall("POST", "/api/auth/login", {
      email: adminEmail,
      password: schoolAdminPass,
      role: "admin"
    });
    adminToken = loginRes.token;
    adminUserId = loginRes.user_id;
  } catch (err) {
    console.log(`  ⚠ Failed to login as admin for chat: ${err.message}`);
    return;
  }
  
  const originalToken = authToken;
  
  try {
    authToken = adminToken;
    const conv = await apiCall("POST", "/api/messages/conversations", {
      recipient_id: teacherUserId
    });
    const convId = conv._id || conv.id;
    
    await apiCall("POST", `/api/messages/conversations/${convId}/messages`, {
      text: "Hello Teacher, how is Grade 1-A's academic performance progressing? Are all lessons on track?"
    });
    
    authToken = teacherToken;
    await apiCall("POST", `/api/messages/conversations/${convId}/messages`, {
      text: "Hello Admin! Yes, the class is performing very well. We have covered 80% of the syllabus, and the monthly tests have been completed successfully."
    });
    
    authToken = adminToken;
    await apiCall("POST", `/api/messages/conversations/${convId}/messages`, {
      text: "Excellent. Please prepare the syllabus alignment reports for the upcoming parent-teacher meeting."
    });
    
    authToken = teacherToken;
    await apiCall("POST", `/api/messages/conversations/${convId}/messages`, {
      text: "Sure, I will draft the reports and share them with you by tomorrow."
    });
    
    console.log("✓ Chat messages conversation created successfully.");
  } catch (err) {
    console.log(`  ⚠ Failed to seed chat conversation: ${err.message}`);
  } finally {
    authToken = originalToken;
  }
}

async function seedSchedules(teacherEmail) {
  console.log("→ Seeding schedules/calendar tasks...");
  const now = new Date();
  
  const start1 = new Date(now);
  start1.setDate(now.getDate() + 1);
  start1.setHours(10, 0, 0, 0);
  const end1 = new Date(start1);
  end1.setHours(start1.getHours() + 1);
  
  const adminScheduleBody = {
    title: "Annual Syllabus Alignment Meeting",
    description: "Meeting with all department heads to coordinate mid-term exam syllabi.",
    start_datetime: start1.toISOString(),
    end_datetime: end1.toISOString(),
    all_day: false,
    event_type: "meeting",
    priority: "high",
    color: "#3b82f6",
    location: "Principal Conference Room",
    reminder_type: "30min"
  };
  
  try {
    await apiCall("POST", "/api/schedules", adminScheduleBody);
  } catch (err) {
    // ignore
  }
  
  const start2 = new Date(now);
  start2.setDate(now.getDate() + 3);
  start2.setHours(14, 0, 0, 0);
  const end2 = new Date(start2);
  end2.setHours(start2.getHours() + 2);
  
  const originalToken = authToken;
  try {
    const loginRes = await apiCall("POST", "/api/auth/login", {
      email: teacherEmail,
      password: defaultPass,
      role: "teacher"
    });
    authToken = loginRes.token;
    
    const teacherScheduleBody = {
      title: "Grade Homework Submissions",
      description: "Grade the Chapter 4 mathematics assignments submitted by Grade 1-A students.",
      start_datetime: start2.toISOString(),
      end_datetime: end2.toISOString(),
      all_day: false,
      event_type: "task",
      priority: "medium",
      color: "#f59e0b",
      location: "Staff Room",
      reminder_type: "1hour"
    };
    
    await apiCall("POST", "/api/schedules", teacherScheduleBody);
    console.log("✓ Seeded schedules successfully.");
  } catch (err) {
    console.log(`  ⚠ Failed to seed schedules: ${err.message}`);
  } finally {
    authToken = originalToken;
  }
}

async function seedSettings() {
  console.log("→ Seeding school settings/branding...");
  const settingsBody = {
    profile: {
      schoolName: "Dummy Data School",
      email: "dummydata@gmail.com",
      phone: "03001234567",
      address: "123 Main Education Boulevard, Lahore, Pakistan",
      principalName: "Dr. Muhammad Ali",
      website: "https://www.dummydata.edu.pk",
      city: "Lahore"
    },
    branding: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e3a8a",
      logoUrl: "https://ui-avatars.com/api/?name=DS&background=eff6ff&color=2563eb&size=200&bold=true",
      themeMode: "light"
    },
    academic: {
      passingPercentage: 40,
      attendanceThreshold: 75
    }
  };
  
  try {
    await apiCall("PATCH", "/api/settings", settingsBody);
    console.log("✓ School settings and branding seeded successfully.");
  } catch (err) {
    console.log(`  ⚠ Failed to seed settings: ${err.message}`);
  }
}

async function seedChaptersAndPapers(classes, teachers, subjects) {
  console.log("→ Seeding chapters, questions and question papers...");
  
  // 1. Seed defaults chapters for first few classes
  let chapterCount = 0;
  const targetClasses = classes.slice(0, 3); // Seed for Class-1, Class-2, Class-3
  for (const cls of targetClasses) {
    const classId = cls._id || cls.id;
    for (const subj of subjects) {
      const subjectId = subj._id || subj.id;
      try {
        await apiCall("POST", "/api/chapters/seed-defaults", {
          class_id: classId,
          subject_id: subjectId
        });
        chapterCount++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Triggered default chapter seeding for ${chapterCount} class-subject pairs.`);

  // Get Class-1-A chapters to use chapter_id for questions
  const class1 = classes[0];
  const class1Id = class1._id || class1.id;
  const mathSubject = subjects.find(s => s.name.toLowerCase().includes("math")) || subjects[0];
  const mathSubjectId = mathSubject._id || mathSubject.id;

  let chId = "";
  try {
    const chList = await apiCall("GET", `/api/chapters?class_id=${class1Id}&subject_id=${mathSubjectId}`);
    if (chList && chList.length > 0) {
      chId = chList[0]._id || chList[0].id;
    }
  } catch (err) {
    // ignore
  }

  // 2. Seed some questions in the question bank for Class-1-A Mathematics
  const questionsToSeed = [
    {
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_id: chId,
      type: "mcq",
      difficulty: "easy",
      question_html: "What is the value of 8 + 4?",
      options: JSON.stringify(["10", "11", "12", "14"]),
      marks: 2
    },
    {
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_id: chId,
      type: "mcq",
      difficulty: "medium",
      question_html: "Which of the following is an even number?",
      options: JSON.stringify(["7", "9", "12", "15"]),
      marks: 2
    },
    {
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_id: chId,
      type: "short",
      difficulty: "easy",
      question_html: "Write the number 45 in words.",
      options: "[]",
      marks: 5
    },
    {
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_id: chId,
      type: "short",
      difficulty: "medium",
      question_html: "Solve: 25 - 13 = ?",
      options: "[]",
      marks: 5
    },
    {
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_id: chId,
      type: "long",
      difficulty: "hard",
      question_html: "Explain the addition place value chart with an example of adding 23 and 45.",
      options: "[]",
      marks: 10
    }
  ];

  let seededQCount = 0;
  const questionIds = [];
  for (const q of questionsToSeed) {
    try {
      const created = await apiCall("POST", "/api/questions", q);
      const qId = created._id || created.id;
      if (qId) {
        questionIds.push(qId);
      }
      seededQCount++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${seededQCount} questions in the question bank.`);

  // Log in as Super Admin and approve 2 questions to Global Bank
  if (questionIds.length > 0) {
    const originalToken = authToken;
    try {
      console.log(`→ Logging in as Platform Super Admin to approve questions...`);
      const superLoginBody = {
        email: superAdminEmail,
        password: superAdminPass,
        role: "admin",
      };
      const superData = await apiCall("POST", "/api/auth/login", superLoginBody);
      authToken = superData.token;
      
      const approveCount = Math.min(2, questionIds.length);
      let approved = 0;
      for (let i = 0; i < approveCount; i++) {
        const qId = questionIds[i];
        try {
          await apiCall("POST", `/api/questions/${qId}/approve`);
          approved++;
        } catch (err) {
          console.log(`  ⚠ Failed to approve question ${qId}: ${err.message}`);
        }
      }
      console.log(`✓ Approved ${approved} questions into the Global Question Bank.`);
    } catch (err) {
      console.log(`  ⚠ Failed to approve questions: ${err.message}`);
    } finally {
      authToken = originalToken; // restore original school admin token
    }
  }

  // 3. Seed some Question Papers in the database (Saved Papers)
  const teacher = teachers[0];
  const teacherId = teacher._id || teacher.id;
  
  const papersToSeed = [
    {
      title: "Mathematics Mid-Term Assessment",
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_ids: chId ? [chId] : [],
      teacher_id: teacherId,
      date: new Date().toISOString().split("T")[0],
      questions: [
        { question: "What is the value of 8 + 4?", marks: 2, type: "mcq", options: ["10", "11", "12", "14"] },
        { question: "Which of the following is an even number?", marks: 2, type: "mcq", options: ["7", "9", "12", "15"] },
        { question: "Write the number 45 in words.", marks: 5, type: "short" },
        { question: "Solve: 25 - 13 = ?", marks: 5, type: "short" },
        { question: "Explain the addition place value chart with an example.", marks: 10, type: "long" }
      ]
    },
    {
      title: "Mathematics Class Test - Chapter 1",
      class_id: class1Id,
      subject_id: mathSubjectId,
      chapter_ids: chId ? [chId] : [],
      teacher_id: teacherId,
      date: new Date().toISOString().split("T")[0],
      questions: [
        { question: "What is 10 + 20?", marks: 2, type: "mcq", options: ["20", "30", "40", "50"] },
        { question: "Solve: 15 - 5 = ?", marks: 3, type: "short" }
      ]
    }
  ];

  let seededPaperCount = 0;
  for (const p of papersToSeed) {
    try {
      await apiCall("POST", "/api/question-papers", p);
      seededPaperCount++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${seededPaperCount} question papers in the saved list.`);
}

main().catch(console.error);

