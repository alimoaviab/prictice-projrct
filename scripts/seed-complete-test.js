#!/usr/bin/env node

/**
 * Eduplexo Complete Custom Dummy Data Seeding Script
 * 
 * Seeds:
 *  - School resetting: Deletes 'test@school.com' if it exists.
 *  - 1 School registration: test@school.com / Test@123
 *  - Super Admin approval & custom/premium subscription assignment
 *  - 2 Academic Years (2025-2026, 2026-2027)
 *  - 25 Teachers (test@teacher.com / Test@123 as teacher 1)
 *  - 20 Classes (Grade 1-A to Grade 10-A, Grade 1-B to Grade 10-B)
 *  - 500 Students (25 per class, test@student.com / Test@123 in Class 1)
 *  - Timetables for all 20 classes
 *  - Leaves: Approved, Rejected, Pending leaves for students and teachers
 *  - Behavior records
 *  - Attendance history (30 days for Class 1, 5 days for others)
 *  - Homework assignments
 *  - Exams & Tests with student marks/results
 *  - Live classes
 *  - Announcements
 *  - Certificate templates & issued certificates
 *  - Fee types, class components, generated invoices, and paid invoices
 *  - Task schedules
 *  - Chat conversations between Admin, Teacher, and Student
 */

const baseURL = process.env.BASE_URL || "http://localhost:8080";
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "eduplexo@gmail.com";
const superAdminPass = process.env.SUPER_ADMIN_PASS || "Test@123";

const schoolAdminEmail = "test@school.com";
const schoolAdminPass = "Test@123";

const testTeacherEmail = "test@teacher.com";
const testStudentEmail = "test@student.com";
const defaultPass = "Test@123";

const subjectsList = [
  "Mathematics", "English", "Science", "Urdu", "Islamic Studies",
  "Social Studies", "Computer Science", "Physics", "Chemistry", "Biology"
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

async function apiCall(method, path, body = null, tokenOverride = null) {
  const url = `${baseURL}${path}`;
  const headers = {
    "Content-Type": "application/json",
  };
  const token = tokenOverride !== null ? tokenOverride : authToken;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
    json = text ? JSON.parse(text) : {};
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

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("=========================================================");
  console.log("    EDUPLEXO CUSTOM COMPLETE DATA SEED SCRIPT");
  console.log("=========================================================");
  console.log(`Target API:     ${baseURL}`);
  console.log(`School Admin:   ${schoolAdminEmail}`);
  console.log("=========================================================");

  // 1. Log in as Super Admin & Reset School if it exists
  let superAdminToken = "";
  try {
    console.log(`→ Logging in as Platform Super Admin (${superAdminEmail})...`);
    const superData = await apiCall("POST", "/api/auth/login", {
      email: superAdminEmail,
      password: superAdminPass,
      role: "admin",
    });
    superAdminToken = superData.token;
    console.log("✓ Logged in as Super Admin.");
    
    // Search for existing school
    console.log("→ Checking if school exists...");
    const schoolsData = await apiCall("GET", "/api/super-admin/schools", null, superAdminToken);
    const schoolsList = schoolsData.items || schoolsData;
    let existingSchoolID = "";
    for (const sch of schoolsList) {
      if (sch.email?.toLowerCase() === schoolAdminEmail.toLowerCase() || 
          sch.owner_email?.toLowerCase() === schoolAdminEmail.toLowerCase() || 
          sch.code === "TESTSCHOOL") {
        existingSchoolID = sch._id || sch.id;
        break;
      }
    }

    if (existingSchoolID) {
      console.log(`⚠ Found existing school with ID ${existingSchoolID}. Deleting for clean seed...`);
      await apiCall("DELETE", `/api/super-admin/schools/${existingSchoolID}`, null, superAdminToken);
      console.log("✓ Existing school and all associated data permanently deleted.");
    }
  } catch (err) {
    console.error(`Warning during Super Admin reset checks: ${err.message}`);
  }

  // 2. Submit new school signup registration
  console.log("→ Submitting school signup registration...");
  const signupBody = {
    role: "admin",
    email: schoolAdminEmail,
    password: schoolAdminPass,
    fullName: "School Admin",
    schoolName: "Test School",
    schoolCode: "TESTSCHOOL",
  };
  try {
    await apiCall("POST", "/api/auth/signup", signupBody);
    console.log("✓ School signup request submitted.");
  } catch (err) {
    console.error(`Fatal: School signup failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Super Admin approves school and assigns premium subscription
  let dbSchoolID = "";
  let tenantSchoolID = "";
  try {
    if (!superAdminToken) {
      const superData = await apiCall("POST", "/api/auth/login", {
        email: superAdminEmail,
        password: superAdminPass,
        role: "admin",
      });
      superAdminToken = superData.token;
    }
    
    // Get School ID
    const schoolsData = await apiCall("GET", "/api/super-admin/schools", null, superAdminToken);
    const schoolsList = schoolsData.items || schoolsData;
    for (const sch of schoolsList) {
      if (sch.email?.toLowerCase() === schoolAdminEmail.toLowerCase() || 
          sch.owner_email?.toLowerCase() === schoolAdminEmail.toLowerCase() || 
          sch.code === "TESTSCHOOL") {
        dbSchoolID = sch._id || sch.id;
        tenantSchoolID = sch.school_id;
        break;
      }
    }
    
    if (!dbSchoolID || !tenantSchoolID) {
      throw new Error("School not found in super admin list after registration!");
    }
    
    console.log(`Found registered school DB ID: ${dbSchoolID}, Tenant ID: ${tenantSchoolID}. Sending approval request...`);
    await apiCall("POST", `/api/super-admin/schools/${dbSchoolID}/approve`, null, superAdminToken);
    console.log("✓ School approved.");
    
    console.log("→ Assigning premium custom plan subscription to allow unlimited student/feature seeding...");
    const assignBody = {
      school_id: tenantSchoolID,
      plan_id: "", // custom plan
      student_limit: 1000,
      duration_days: 365,
      price: 0,
    };
    await apiCall("POST", "/api/super-admin/subscriptions/assign", assignBody, superAdminToken);
    console.log("✓ Premium custom subscription assigned.");
  } catch (err) {
    console.error(`Fatal Super Admin approval or subscription assign failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Log in as School Admin
  try {
    const data = await apiCall("POST", "/api/auth/login", {
      email: schoolAdminEmail,
      password: schoolAdminPass,
      role: "admin",
    });
    authToken = data.token;
    console.log("✓ Logged in as School Admin.");
  } catch (err) {
    console.error(`Fatal: Failed to login as School Admin: ${err.message}`);
    process.exit(1);
  }

  // 5. Seed 2 Academic Years
  console.log("→ Seeding academic years...");
  let academicYearID = "";
  try {
    const currentYear = new Date().getFullYear();
    const year1Body = {
      year: `${currentYear - 1}-${currentYear}`,
      start_date: `${currentYear - 1}-04-01`,
      end_date: `${currentYear}-03-31`,
      is_active: false,
    };
    await apiCall("POST", "/api/academic-years", year1Body);
    console.log(`✓ Created past academic year: ${year1Body.year}`);

    const year2Body = {
      year: `${currentYear}-${currentYear + 1}`,
      start_date: `${currentYear}-04-01`,
      end_date: `${currentYear + 1}-03-31`,
      is_active: true,
    };
    const year2 = await apiCall("POST", "/api/academic-years", year2Body);
    academicYearID = year2._id || year2.id;
    console.log(`✓ Created current active academic year: ${year2Body.year} ID: ${academicYearID}`);
  } catch (err) {
    console.error(`Fatal: Failed to create academic years: ${err.message}`);
    process.exit(1);
  }

  // 6. Create Subjects
  console.log("→ Checking/Creating subjects...");
  const subjects = [];
  for (const name of subjectsList) {
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

  // 7. Create 25 Teachers (Teacher 1 is test@teacher.com)
  console.log("→ Creating 25 teachers...");
  const teachers = [];
  for (let i = 1; i <= 25; i++) {
    let email = `teacher${i}@gmail.com`;
    let first = pickRandom(firstNames);
    let last = pickRandom(lastNames);
    if (i === 1) {
      email = testTeacherEmail;
      first = "Test";
      last = "Teacher";
    }

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
  console.log(`✓ Seeded ${teachers.length} teachers.`);

  // 8. Create 20 Classes (Grade 1-A to 10-A, 1-B to 10-B)
  console.log("→ Creating 20 classes...");
  const classes = [];
  const classNames = [];
  for (let grade = 1; grade <= 10; grade++) {
    classNames.push({ grade: String(grade), section: "A" });
    classNames.push({ grade: String(grade), section: "B" });
  }

  for (let i = 0; i < classNames.length; i++) {
    const clsInfo = classNames[i];
    const name = `Grade ${clsInfo.grade}-${clsInfo.section}`;
    
    // Class teacher assignment
    let classTeacherID = teachers[i % teachers.length]._id || teachers[i % teachers.length].id;
    const teacherIDs = [classTeacherID];
    
    // Assign 2 other random teachers to class
    for (let j = 0; j < 2; j++) {
      const randT = teachers[(i + j + 1) % teachers.length]._id || teachers[(i + j + 1) % teachers.length].id;
      if (!teacherIDs.includes(randT)) {
        teacherIDs.push(randT);
      }
    }

    const subjectIDs = subjects.map(s => s._id || s.id);

    const body = {
      name,
      grade: clsInfo.grade,
      section: clsInfo.section,
      capacity: 50,
      passing_percentage: 40,
      academic_year_id: academicYearID,
      class_teacher_id: classTeacherID,
      teacher_ids: teacherIDs,
      subject_ids: subjectIDs,
      room_number: String(100 + (i + 1)),
    };

    try {
      const created = await apiCall("POST", "/api/classes", body);
      classes.push(created);
    } catch (err) {
      console.log(`  ⚠ Failed to create class ${name}: ${err.message}`);
    }
  }
  console.log(`✓ Seeded ${classes.length} classes.`);

  // 9. Create 500 Students (25 per class, Student 1 in Class 1 is test@student.com)
  console.log("→ Creating 500 students (25 per class)...");
  const students = [];
  let testStudentObj = null;

  for (let classIdx = 0; classIdx < classes.length; classIdx++) {
    const cls = classes[classIdx];
    const classId = cls._id || cls.id;
    const section = cls.section;

    for (let studentIdx = 1; studentIdx <= 25; studentIdx++) {
      const rollNo = `R-${classIdx + 1}-${String(studentIdx).padStart(3, "0")}`;
      let email = `student_c${classIdx + 1}_${studentIdx}@gmail.com`;
      let first = pickRandom(firstNames);
      let last = pickRandom(lastNames);

      if (classIdx === 0 && studentIdx === 1) {
        email = testStudentEmail;
        first = "Test";
        last = "Student";
      }

      const gender = studentIdx % 2 === 0 ? "female" : "male";

      const body = {
        email,
        password: defaultPass,
        first_name: first,
        last_name: last,
        class_id: classId,
        section: section,
        roll_no: rollNo,
        gender,
        guardian: {
          name: `Guardian of ${first} ${last}`,
          phone: `0321${String(2000000 + classIdx * 25 + studentIdx).slice(1)}`,
          email: email,
        },
        status: "active",
      };

      try {
        const created = await apiCall("POST", "/api/students", body);
        students.push(created);
        if (classIdx === 0 && studentIdx === 1) {
          testStudentObj = created;
        }
      } catch (err) {
        console.log(`    ⚠ Failed to create student ${email}: ${err.message}`);
      }
    }
  }
  console.log(`✓ Seeded ${students.length} students total.`);

  // 10. Seed weekly timetables for all 20 classes (Mon-Fri)
  console.log("→ Seeding weekly timetables Mon-Fri...");
  let timetableCount = 0;
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

    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= 5; period++) {
        const teacher = teachers[(day + period + classIdx) % teachers.length];
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
          timetableCount++;
        } catch (err) {
          // ignore timetable session overlaps or failures
        }
      }
    }
  }
  console.log(`✓ Seeded ${timetableCount} timetable sessions.`);

  // 11. Seed student attendance history (30 days for Class 1, 5 days for others)
  console.log("→ Seeding student attendance history...");
  let attendanceCount = 0;
  const attendanceStatuses = ["present", "present", "present", "present", "absent", "late"];
  const now = new Date();

  // Filter students of class 1
  const class1Students = students.filter(s => s.class_id === classes[0]._id || s.class_id === classes[0].id);

  for (let d = 0; d < 30; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
    const dateStr = date.toISOString().split("T")[0];

    for (const student of class1Students) {
      // For test student, make it 90% present
      let status = pickRandom(attendanceStatuses);
      if (student.email === testStudentEmail) {
        status = d % 10 === 0 ? "late" : d % 15 === 0 ? "absent" : "present";
      }
      
      const body = {
        student_id: student._id || student.id,
        class_id: student.class_id,
        date: dateStr,
        status,
      };

      try {
        await apiCall("POST", "/api/attendance", body);
        attendanceCount++;
      } catch (err) {
        // ignore
      }
    }
  }

  // Seed 5 days for a subset of other class students to populate reports
  const otherClassStudents = students.filter(s => s.class_id !== (classes[0]._id || classes[0].id)).slice(0, 100);
  for (let d = 0; d < 5; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split("T")[0];

    for (const student of otherClassStudents) {
      const body = {
        student_id: student._id || student.id,
        class_id: student.class_id,
        date: dateStr,
        status: pickRandom(attendanceStatuses),
      };

      try {
        await apiCall("POST", "/api/attendance", body);
        attendanceCount++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Seeded ${attendanceCount} attendance records.`);

  // 12. Seed leave requests (Approved, Rejected, Pending)
  console.log("→ Seeding leave requests...");
  let leaveCount = 0;
  
  // Student leaves for testStudentObj
  if (testStudentObj) {
    const studentId = testStudentObj._id || testStudentObj.id;
    const testLeaves = [
      { type: "Sick", days: 1, reason: "Suffering from flu and fever.", status: "approved" },
      { type: "Casual", days: 2, reason: "Going to attend sister's wedding.", status: "rejected" },
      { type: "Emergency", days: 1, reason: "Urgent domestic work at home.", status: "pending" }
    ];

    for (let i = 0; i < testLeaves.length; i++) {
      const leave = testLeaves[i];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i + 1) * 3);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + leave.days);

      const body = {
        requester_type: "student",
        requester_id: studentId,
        requester_name: `${testStudentObj.first_name} ${testStudentObj.last_name}`,
        class_id: testStudentObj.class_id,
        leave_type: leave.type,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        reason: leave.reason,
        status: "pending", // must create as pending first
      };

      try {
        const created = await apiCall("POST", "/api/leave", body);
        const leaveId = created._id || created.id;
        leaveCount++;

        // If target status is not pending, update it
        if (leave.status !== "pending") {
          await apiCall("PATCH", `/api/leave/${leaveId}`, { status: leave.status });
        }
      } catch (err) {
        console.log(`  ⚠ Student leave creation failed: ${err.message}`);
      }
    }
  }

  // Teacher leaves for test@teacher.com (Teacher 1)
  const primaryTeacher = teachers[0];
  if (primaryTeacher) {
    const teacherId = primaryTeacher._id || primaryTeacher.id;
    const testLeaves = [
      { type: "Casual", days: 2, reason: "Personal family matters.", status: "approved" },
      { type: "Sick", days: 1, reason: "Medical checkup.", status: "rejected" },
      { type: "Annual", days: 3, reason: "Summer vacation trip.", status: "pending" }
    ];

    for (let i = 0; i < testLeaves.length; i++) {
      const leave = testLeaves[i];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i + 2) * 4);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + leave.days);

      const body = {
        requester_type: "teacher",
        requester_id: teacherId,
        requester_name: `${primaryTeacher.first_name} ${primaryTeacher.last_name}`,
        leave_type: leave.type,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        reason: leave.reason,
        status: "pending",
      };

      try {
        const created = await apiCall("POST", "/api/leave", body);
        const leaveId = created._id || created.id;
        leaveCount++;

        if (leave.status !== "pending") {
          await apiCall("PATCH", `/api/leave/${leaveId}`, { status: leave.status });
        }
      } catch (err) {
        console.log(`  ⚠ Teacher leave creation failed: ${err.message}`);
      }
    }
  }
  console.log(`✓ Seeded and updated ${leaveCount} leaves.`);

  // 13. Seed student behavior records
  console.log("→ Seeding student behavior logs...");
  let behaviorCount = 0;
  if (testStudentObj) {
    const studentId = testStudentObj._id || testStudentObj.id;
    const primaryTeacherId = primaryTeacher._id || primaryTeacher.id;
    
    const behaviors = [
      { category: "conduct", description: "Arrived late to class multiple times this week.", severity: "medium", action: "Verbal warning given." },
      { category: "conduct", description: "Talked repeatedly during lectures and disrupted class.", severity: "medium", action: "Counseled student after class." },
      { category: "achievement", description: "Scored full marks in Mathematics monthly test. Excellent effort!", severity: "low", action: "Awarded appreciation certificate." }
    ];

    for (const bh of behaviors) {
      const body = {
        student_id: studentId,
        class_id: testStudentObj.class_id,
        teacher_id: primaryTeacherId,
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
        behaviorCount++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Seeded ${behaviorCount} behavior logs.`);

  // 14. Seed homework assignments
  console.log("→ Seeding homework assignments...");
  let homeworkCount = 0;
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const classId = cls._id || cls.id;
    
    // Assign 3 homeworks per class
    for (let hw = 1; hw <= 3; hw++) {
      const subj = subjects[(i + hw) % subjects.length];
      const teacher = teachers[(i + hw) % teachers.length];
      const dueAt = new Date();
      dueAt.setDate(now.getDate() + hw * 3);

      const body = {
        class_id: classId,
        teacher_id: teacher._id || teacher.id,
        subject: subj.name,
        subject_id: subj._id || subj.id,
        title: `${subj.name} Homework Assignment #${hw}`,
        instructions: `Read chapter ${hw} thoroughly. Solve the exercises and answer questions 1 to 5 in your homework notebooks.`,
        due_at: dueAt.toISOString().split("T")[0],
        status: "assigned",
      };

      try {
        await apiCall("POST", "/api/homework", body);
        homeworkCount++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Seeded ${homeworkCount} homework assignments.`);

  // 15. Seed exams, tests, and student results/grades
  console.log("→ Seeding exams, tests, and results...");
  let examCount = 0;
  let testCount = 0;
  let resultCount = 0;

  const exams = [];
  const tests = [];

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const classId = cls._id || cls.id;

    // 1 Mid-term Exam and 1 Final Exam per class
    for (const examName of ["Mid-Term", "Final"]) {
      const subj = subjects[i % subjects.length];
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() - (examName === "Mid-Term" ? 10 : 2));
      
      const body = {
        class_id: classId,
        subject: subj.name,
        title: `${examName} Exam - ${subj.name} (${cls.name})`,
        starts_at: startsAt.toISOString().split("T")[0],
        max_marks: 100,
        description: `${examName} examination session.`,
      };

      try {
        const created = await apiCall("POST", "/api/exams", body);
        exams.push(created);
        examCount++;
      } catch (err) {
        // ignore
      }
    }

    // 2 Weekly Tests per class
    for (let t = 1; t <= 2; t++) {
      const subj = subjects[(i + t) % subjects.length];
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() - t * 4);

      const body = {
        class_id: classId,
        subject: subj.name,
        title: `Weekly Test #${t} - ${subj.name} (${cls.name})`,
        starts_at: startsAt.toISOString().split("T")[0],
        max_marks: 50,
        description: `Weekly chapter diagnostic test.`,
      };

      try {
        const created = await apiCall("POST", "/api/tests", body);
        tests.push(created);
        testCount++;
      } catch (err) {
        // ignore
      }
    }
  }

  // Populate results for Class 1 (Grade 1-A) students
  const class1Id = classes[0]._id || classes[0].id;
  const class1Exams = exams.filter(e => e.class_id === class1Id);
  const class1Tests = tests.filter(t => t.class_id === class1Id);

  // Seed results for students in Class 1
  for (const student of class1Students) {
    const studentId = student._id || student.id;

    // Exams
    for (const exam of class1Exams) {
      const examId = exam._id || exam.id;
      // test student gets high marks, others randomized
      let marks = 50 + Math.floor(Math.random() * 45); // 50 to 95
      if (student.email === testStudentEmail) {
        marks = 94; // high marks
      }

      const body = {
        exam_id: examId,
        student_id: studentId,
        obtained_marks: marks,
        remarks: marks > 85 ? "Outstanding performance!" : marks > 60 ? "Good work." : "Needs hard work.",
      };

      try {
        await apiCall("POST", "/api/results", body);
        resultCount++;
      } catch (err) {
        // ignore
      }
    }

    // Tests
    for (const test of class1Tests) {
      const testId = test._id || test.id;
      let marks = 20 + Math.floor(Math.random() * 28); // 20 to 48 out of 50
      if (student.email === testStudentEmail) {
        marks = 48; // high marks
      }

      const body = {
        exam_id: testId,
        student_id: studentId,
        obtained_marks: marks,
        remarks: marks > 40 ? "Excellent!" : marks > 25 ? "Pass." : "Fail. Study more.",
      };

      try {
        await apiCall("POST", "/api/results", body);
        resultCount++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Seeded ${examCount} exams, ${testCount} tests, and ${resultCount} results.`);

  // 16. Seed live online classes
  console.log("→ Seeding live classes...");
  let liveClassCount = 0;
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const classId = cls._id || cls.id;
    const subj = subjects[i % subjects.length];
    const teacher = teachers[i % teachers.length];

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1 + i); // scheduled in future
    startTime.setHours(9 + (i % 3), 0, 0, 0);
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
      liveClassCount++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${liveClassCount} live classes.`);

  // 17. Seed Announcements
  console.log("→ Seeding announcements...");
  let announcementsCount = 0;
  const announcements = [
    { title: "Annual Sports Week Schedule", body: "Eduplexo Annual Sports Week will start next Monday. Prepare your sports kits and active participations!", audience: "all", priority: "high" },
    { title: "Mid-Term Examination Schedule", body: "The Mid-Term exam datesheet has been published. Exams will begin next week. Good luck to all students!", audience: "students", priority: "high" },
    { title: "Monthly Parent-Teacher Alignment Meeting (PTM)", body: "Parents are requested to attend the PTM this Saturday between 9:00 AM and 1:00 PM to discuss results.", audience: "parents", priority: "normal" },
    { title: "Syllabus Review and Teacher Meeting", body: "A mandatory general staff meeting will be held in the principal conference room today at 2:00 PM to review syllabus progress.", audience: "teachers", priority: "high" }
  ];

  for (const a of announcements) {
    const body = {
      title: a.title,
      body: a.body,
      audience: a.audience,
      priority: a.priority
    };
    try {
      await apiCall("POST", "/api/announcements", body);
      announcementsCount++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`✓ Seeded ${announcementsCount} announcements.`);

  // 18. Seed certificate templates and generate/issue certificates
  console.log("→ Seeding certificate templates and issuing certificates...");
  let issuedCount = 0;
  const templates = [
    { name: "Excellence Academic Certificate", type: "merit", body: "This certificate is awarded to the student for demonstrating outstanding academic performance and leadership during this term." },
    { name: "Model Student Character Certificate", type: "character", body: "This is to certify that the student has shown exemplary morals, conduct, and behavior within the school premises." }
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

  if (savedTemplates.length > 0 && testStudentObj) {
    const studentId = testStudentObj._id || testStudentObj.id;
    for (const template of savedTemplates) {
      const templateId = template._id || template.id;
      const body = {
        template_id: templateId,
        student_ids: [studentId]
      };
      try {
        await apiCall("POST", "/api/certificates/generate", body);
        issuedCount++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`✓ Seeded templates and issued ${issuedCount} certificates.`);

  // 19. Seed fee structures, monthly invoices, and payment history
  console.log("→ Seeding fees and recording invoices...");
  let feeInvoicesCount = 0;
  let feePaymentsCount = 0;
  const feeTypes = [
    { name: "Monthly Tuition Fee", category: "tuition", is_recurring: true },
    { name: "Monthly Transport Service Fee", category: "transport", is_recurring: true },
    { name: "Computer Laboratory Fee", category: "lab", is_recurring: true },
    { name: "Term Examination Fee", category: "exam", is_recurring: false }
  ];

  const savedFeeTypes = [];
  for (const ft of feeTypes) {
    const body = {
      name: ft.name,
      description: `${ft.name} setup`,
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
    // Assign Tuition Fee component to all 20 classes
    const tuitionType = savedFeeTypes.find(t => t.category === "tuition") || savedFeeTypes[0];
    const tuitionTypeId = tuitionType._id || tuitionType.id;

    for (const cls of classes) {
      const classId = cls._id || cls.id;
      const componentBody = {
        fee_type_id: tuitionTypeId,
        amount: 3000,
        type: "recurring",
        recurring_cycle: "monthly",
        status: "active"
      };

      try {
        await apiCall("POST", `/api/classes/${classId}/fees/components`, componentBody);
      } catch (err) {
        // ignore
      }
    }

    // Generate fee invoices for all classes
    const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
    const currentYear = now.getFullYear();

    for (const cls of classes) {
      const classId = cls._id || cls.id;
      const generateBody = {
        class_id: classId,
        month: monthName,
        year: currentYear
      };

      try {
        await apiCall("POST", "/api/fees/generate", generateBody);
        feeInvoicesCount++;
      } catch (err) {
        // ignore
      }
    }

    // Retrieve generated invoices and make payments
    try {
      const invoicesData = await apiCall("GET", "/api/fees");
      const invoicesList = invoicesData.items || invoicesData.data || invoicesData || [];
      
      // Pay the test student invoice fully
      const testInvoice = invoicesList.find(inv => inv.student_id === (testStudentObj._id || testStudentObj.id));
      if (testInvoice) {
        const invoiceId = testInvoice._id || testInvoice.id;
        const amount = testInvoice.effective_amount || testInvoice.amount || 3000;
        
        const payBody = {
          student_id: testStudentObj._id || testStudentObj.id,
          amount: amount,
          method: "cash",
          payment_method: "cash",
          reference_no: `REF-CASH-${Date.now()}`,
          reference: `REF-CASH-${Date.now()}`,
          notes: "Full Tuition Fee Payment",
          payment_date: now.toISOString().split("T")[0]
        };

        await apiCall("POST", `/api/fees/${invoiceId}/pay`, payBody);
        feePaymentsCount++;
      }

      // Pay a few other invoices partially/fully to make reports interesting
      const otherInvoices = invoicesList.filter(inv => inv.student_id !== (testStudentObj?._id || testStudentObj?.id)).slice(0, 15);
      for (let i = 0; i < otherInvoices.length; i++) {
        const inv = otherInvoices[i];
        const invoiceId = inv._id || inv.id;
        const amount = inv.effective_amount || inv.amount || 3000;
        
        // Pay half for partial, full for cash
        const amountToPay = i % 2 === 0 ? amount : Math.round(amount / 2);
        const method = i % 2 === 0 ? "cash" : "bank_transfer";
        
        const payBody = {
          student_id: inv.student_id,
          amount: amountToPay,
          method: method,
          payment_method: method,
          reference_no: `REF-TXN-${Date.now()}-${i}`,
          reference: `REF-TXN-${Date.now()}-${i}`,
          notes: i % 2 === 0 ? "Paid Cash" : "Partial Bank Transfer",
          payment_date: now.toISOString().split("T")[0]
        };

        try {
          await apiCall("POST", `/api/fees/${invoiceId}/pay`, payBody);
          feePaymentsCount++;
        } catch (payErr) {
          // ignore
        }
      }
    } catch (invErr) {
      console.log(`  ⚠ Failed to record payments: ${invErr.message}`);
    }
  }
  console.log(`✓ Configured component, generated invoices for classes, paid ${feePaymentsCount} invoices.`);

  // 20. Seed calendar tasks/schedules
  console.log("→ Seeding calendar tasks/schedules...");
  let scheduleCount = 0;
  
  const start1 = new Date();
  start1.setDate(start1.getDate() + 1);
  start1.setHours(10, 0, 0, 0);
  const end1 = new Date(start1);
  end1.setHours(start1.getHours() + 1);

  // Admin schedule
  const adminSchedule = {
    title: "Quarterly Curriculum Review Meeting",
    description: "Meeting with academic heads to review teacher performance and student syllabus coverage.",
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
    await apiCall("POST", "/api/schedules", adminSchedule);
    scheduleCount++;
  } catch (err) {
    // ignore
  }

  // Teacher schedule (requires logging in as teacher)
  let teacherToken = "";
  try {
    const tLogin = await apiCall("POST", "/api/auth/login", {
      email: testTeacherEmail,
      password: defaultPass,
      role: "teacher"
    });
    teacherToken = tLogin.token;

    const start2 = new Date();
    start2.setDate(start2.getDate() + 2);
    start2.setHours(14, 0, 0, 0);
    const end2 = new Date(start2);
    end2.setHours(start2.getHours() + 2);

    const teacherSchedule = {
      title: "Grade Mathematics Term Exams",
      description: "Evaluate midterm test sheets of Grade 1-A students.",
      start_datetime: start2.toISOString(),
      end_datetime: end2.toISOString(),
      all_day: false,
      event_type: "task",
      priority: "medium",
      color: "#f59e0b",
      location: "Main Staff Room",
      reminder_type: "1hour"
    };

    await apiCall("POST", "/api/schedules", teacherSchedule, teacherToken);
    scheduleCount++;
  } catch (err) {
    console.log(`  ⚠ Failed to create teacher calendar schedule: ${err.message}`);
  }
  console.log(`✓ Seeded ${scheduleCount} calendar events.`);

  // 21. Seed Chat Conversations
  console.log("→ Seeding chat conversations...");
  try {
    // We need tokens and user_ids for Admin, Teacher, and Student
    const adminLogin = await apiCall("POST", "/api/auth/login", {
      email: schoolAdminEmail,
      password: schoolAdminPass,
      role: "admin"
    });
    const adminToken = adminLogin.token;
    const adminUserId = adminLogin.user_id;

    const teacherLogin = await apiCall("POST", "/api/auth/login", {
      email: testTeacherEmail,
      password: defaultPass,
      role: "teacher"
    });
    const tToken = teacherLogin.token;
    const tUserId = teacherLogin.user_id;

    const studentLogin = await apiCall("POST", "/api/auth/login", {
      email: testStudentEmail,
      password: defaultPass,
      role: "student"
    });
    const sToken = studentLogin.token;
    const sUserId = studentLogin.user_id;

    // A. Conversation Admin <-> Teacher
    console.log("  → Conversation Admin <-> Teacher");
    const convAT = await apiCall("POST", "/api/messages/conversations", { recipient_id: tUserId }, adminToken);
    const convATId = convAT._id || convAT.id;

    await apiCall("POST", `/api/messages/conversations/${convATId}/messages`, { text: "Hello Teacher, has Class Grade 1-A completed their syllabus for Mathematics?" }, adminToken);
    await apiCall("POST", `/api/messages/conversations/${convATId}/messages`, { text: "Hello Admin, yes. We have completed the first 5 chapters and results of the weekly test are uploaded." }, tToken);
    await apiCall("POST", `/api/messages/conversations/${convATId}/messages`, { text: "Fantastic work. Please prepare the syllabus alignment reports by Friday." }, adminToken);
    await apiCall("POST", `/api/messages/conversations/${convATId}/messages`, { text: "Will do. Thank you!" }, tToken);

    // B. Conversation Admin <-> Student
    console.log("  → Conversation Admin <-> Student");
    const convAS = await apiCall("POST", "/api/messages/conversations", { recipient_id: sUserId }, adminToken);
    const convASId = convAS._id || convAS.id;

    await apiCall("POST", `/api/messages/conversations/${convASId}/messages`, { text: "Hello Student, we noticed your academic excellence in midterm tests. Keep it up!" }, adminToken);
    await apiCall("POST", `/api/messages/conversations/${convASId}/messages`, { text: "Thank you so much, Admin! I am working hard with my teachers." }, sToken);
    await apiCall("POST", `/api/messages/conversations/${convASId}/messages`, { text: "Let us know if you need any resources or assistance." }, adminToken);
    await apiCall("POST", `/api/messages/conversations/${convASId}/messages`, { text: "Sure, thank you for checking in!" }, sToken);

    // C. Conversation Teacher <-> Student
    console.log("  → Conversation Teacher <-> Student");
    const convTS = await apiCall("POST", "/api/messages/conversations", { recipient_id: sUserId }, tToken);
    const convTSId = convTS._id || convTS.id;

    await apiCall("POST", `/api/messages/conversations/${convTSId}/messages`, { text: "Dear Student, please submit the Mathematics homework notebook by tomorrow morning." }, tToken);
    await apiCall("POST", `/api/messages/conversations/${convTSId}/messages`, { text: "Sure teacher, I have completed the exercise and will bring my notebook to the staff room." }, sToken);
    await apiCall("POST", `/api/messages/conversations/${convTSId}/messages`, { text: "Great. Please ensure your parent signs the monthly diagnostic test report." }, tToken);
    await apiCall("POST", `/api/messages/conversations/${convTSId}/messages`, { text: "Yes, my guardian has signed it and I will submit it." }, sToken);

    console.log("✓ Seeding chat conversations completed successfully.");
  } catch (chatErr) {
    console.log(`  ⚠ Failed to seed chat conversations: ${chatErr.message}`);
  }

  console.log("=========================================================");
  console.log("    ✓ CUSTOM SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=========================================================");
  console.log("LOGIN CREDENTIALS FOR VERIFICATION:");
  console.log(`  School Admin:      ${schoolAdminEmail} / ${schoolAdminPass}`);
  console.log(`  Teacher Account:   ${testTeacherEmail} / ${defaultPass}`);
  console.log(`  Student Account:   ${testStudentEmail} / ${defaultPass}`);
  console.log("=========================================================");
}

main().catch(err => {
  console.error("Fatal Seeding Script Crash:", err);
  process.exit(1);
});
