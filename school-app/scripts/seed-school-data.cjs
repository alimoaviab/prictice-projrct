/**
 * Seed Demo Data for School
 * - 500 Students
 * - 20 Classes
 * - 20 Teachers
 * - Attendance, Homework, Exams
 */

const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Load .env.local
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/eduplexo";
const SCHOOL_ID = "SCHOOL_001";

// Schemas
const schoolSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "approved" },
    admin_profile: { name: String, email: String, phone: String },
    plan: { key: { type: String, default: "premium" }, seats: { type: Number, default: 500 } },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "schools" }
);

const classSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    section: String,
    class_teacher_id: mongoose.Schema.Types.ObjectId,
    capacity: { type: Number, default: 40 },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "classes" }
);

const studentSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    class_id: mongoose.Schema.Types.ObjectId,
    admission_no: { type: String, required: true, unique: true },
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    date_of_birth: Date,
    gender: String,
    status: { type: String, default: "active" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "students" }
);

const teacherSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    user_id: mongoose.Schema.Types.ObjectId,
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    subject: String,
    qualification: String,
    status: { type: String, default: "active" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "teachers" }
);

const attendanceSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    class_id: mongoose.Schema.Types.ObjectId,
    student_id: mongoose.Schema.Types.ObjectId,
    date: Date,
    status: { type: String, enum: ["present", "absent", "late"], default: "present" },
    marked_by: mongoose.Schema.Types.ObjectId,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "attendance" }
);

const homeworkSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    class_id: mongoose.Schema.Types.ObjectId,
    teacher_id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    due_date: Date,
    subject: String,
    status: { type: String, default: "active" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "homework" }
);

const examSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    class_id: mongoose.Schema.Types.ObjectId,
    title: String,
    subject: String,
    date: Date,
    total_marks: { type: Number, default: 100 },
    status: { type: String, default: "scheduled" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "exams" }
);

const resultSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    exam_id: mongoose.Schema.Types.ObjectId,
    student_id: mongoose.Schema.Types.ObjectId,
    marks_obtained: Number,
    total_marks: Number,
    percentage: Number,
    grade: String,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "results" }
);

const feeSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    class_id: mongoose.Schema.Types.ObjectId,
    student_id: mongoose.Schema.Types.ObjectId,
    amount: Number,
    due_date: Date,
    status: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "fees" }
);

const SchoolModel = mongoose.models.School || mongoose.model("School", schoolSchema);
const ClassModel = mongoose.models.Class || mongoose.model("Class", classSchema);
const StudentModel = mongoose.models.Student || mongoose.model("Student", studentSchema);
const TeacherModel = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
const HomeworkModel = mongoose.models.Homework || mongoose.model("Homework", homeworkSchema);
const ExamModel = mongoose.models.Exam || mongoose.model("Exam", examSchema);
const ResultModel = mongoose.models.Result || mongoose.model("Result", resultSchema);
const FeeModel = mongoose.models.Fee || mongoose.model("Fee", feeSchema);

const subjects = ["Mathematics", "English", "Science", "History", "Geography", "Computer Science", "Urdu", "Islamic Studies"];
const classNames = ["A", "B", "C", "D", "E"];
const firstNames = ["Ahmed", "Ali", "Fatima", "Ayesha", "Hassan", "Zainab", "Muhammad", "Sara", "Omar", "Noor", "Hana", "Bilal", "Layla", "Karim", "Nadia"];
const lastNames = ["Khan", "Ahmed", "Hassan", "Ali", "Shah", "Malik", "Hussain", "Raza", "Siddiqui", "Mirza", "Iqbal", "Farooq", "Nasir", "Rashid", "Saeed"];

async function seedData() {
  try {
    console.log("\n🌱 Seeding School Data...\n");
    console.log(`📦 MongoDB: ${MONGODB_URI}`);
    console.log(`🏫 School ID: ${SCHOOL_ID}`);
    console.log("Connecting to database...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    // Approve school
    console.log("📋 Approving school...");
    await SchoolModel.updateOne(
      { school_id: SCHOOL_ID },
      { $set: { status: "approved" } }
    );
    console.log("✅ School approved\n");

    // Create 20 classes
    console.log("📚 Creating 20 classes...");
    const classes = [];
    for (let i = 1; i <= 20; i++) {
      const className = `Class ${i}`;
      const classDoc = await ClassModel.create({
        school_id: SCHOOL_ID,
        name: className,
        section: classNames[(i - 1) % classNames.length],
        capacity: 25,
      });
      classes.push(classDoc);
    }
    console.log(`✅ Created 20 classes\n`);

    // Create 20 teachers
    console.log("👨‍🏫 Creating 20 teachers...");
    const teachers = [];
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const subject = subjects[i % subjects.length];

      const teacher = await TeacherModel.create({
        school_id: SCHOOL_ID,
        first_name: firstName,
        last_name: lastName,
        email: `teacher${i + 1}@school.com`,
        phone: `+92-300-${String(i + 1).padStart(7, "0")}`,
        subject: subject,
        qualification: "Bachelor's Degree",
        status: "active",
      });
      teachers.push(teacher);
    }
    console.log(`✅ Created 20 teachers\n`);

    // Create 500 students
    console.log("👨‍🎓 Creating 500 students...");
    const students = [];
    let studentCount = 0;

    for (const classDoc of classes) {
      // 25 students per class (20 classes * 25 = 500)
      for (let s = 0; s < 25; s++) {
        const firstName = firstNames[s % firstNames.length];
        const lastName = lastNames[s % lastNames.length];
        const admissionNo = `${SCHOOL_ID}-${classDoc._id.toString().slice(-4)}-${String(s).padStart(3, "0")}`;

        const student = await StudentModel.create({
          school_id: SCHOOL_ID,
          class_id: classDoc._id,
          admission_no: admissionNo,
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${s}@student.com`,
          phone: `+92-300-${String(studentCount + 1).padStart(7, "0")}`,
          date_of_birth: new Date(2010 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: Math.random() > 0.5 ? "Male" : "Female",
          status: "active",
        });
        students.push(student);
        studentCount++;

        // Create attendance records (last 20 days)
        for (let d = 0; d < 20; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
            await AttendanceModel.create({
              school_id: SCHOOL_ID,
              class_id: classDoc._id,
              student_id: student._id,
              date: date,
              status: Math.random() > 0.1 ? "present" : (Math.random() > 0.5 ? "absent" : "late"),
              marked_by: teachers[0]._id,
            });
          }
        }

        // Create fee record
        await FeeModel.create({
          school_id: SCHOOL_ID,
          class_id: classDoc._id,
          student_id: student._id,
          amount: 5000 + Math.random() * 5000,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ["pending", "partial", "paid"][Math.floor(Math.random() * 3)],
        });
      }

      if (studentCount % 100 === 0) {
        console.log(`   ✓ Created ${studentCount}/500 students`);
      }
    }
    console.log(`✅ Created 500 students\n`);

    // Create homework for each class
    console.log("📝 Creating homework assignments...");
    for (const classDoc of classes) {
      for (let h = 0; h < 5; h++) {
        await HomeworkModel.create({
          school_id: SCHOOL_ID,
          class_id: classDoc._id,
          teacher_id: teachers[h % teachers.length]._id,
          title: `Homework ${h + 1}`,
          description: `Complete exercises from chapter ${h + 1}`,
          due_date: new Date(Date.now() + (h + 1) * 24 * 60 * 60 * 1000),
          subject: subjects[h % subjects.length],
          status: "active",
        });
      }
    }
    console.log(`✅ Created homework assignments\n`);

    // Create exams for each class
    console.log("📊 Creating exams and results...");
    for (const classDoc of classes) {
      for (let e = 0; e < 3; e++) {
        const exam = await ExamModel.create({
          school_id: SCHOOL_ID,
          class_id: classDoc._id,
          title: `Exam ${e + 1}`,
          subject: subjects[e % subjects.length],
          date: new Date(Date.now() + (e + 1) * 7 * 24 * 60 * 60 * 1000),
          total_marks: 100,
          status: "scheduled",
        });

        // Create results for each student in class
        const classStudents = await StudentModel.find({ class_id: classDoc._id });
        for (const student of classStudents) {
          const marks = Math.floor(Math.random() * 100);
          await ResultModel.create({
            school_id: SCHOOL_ID,
            exam_id: exam._id,
            student_id: student._id,
            marks_obtained: marks,
            total_marks: 100,
            percentage: marks,
            grade: marks >= 80 ? "A" : marks >= 70 ? "B" : marks >= 60 ? "C" : marks >= 50 ? "D" : "F",
          });
        }
      }
    }
    console.log(`✅ Created exams and results\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SEEDING COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🏫 School: ${SCHOOL_ID} (APPROVED)`);
    console.log(`📚 Classes: 20`);
    console.log(`👨‍🏫 Teachers: 20`);
    console.log(`👨‍🎓 Students: 500`);
    console.log(`📋 Attendance Records: ~10,000`);
    console.log(`💰 Fee Records: 500`);
    console.log(`📝 Homework Assignments: 100`);
    console.log(`📊 Exams: 60`);
    console.log(`📈 Results: 1,500`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("✅ Login Credentials:");
    console.log("   📧 Email: school@gmail.com");
    console.log("   🔑 Password: Test@123");
    console.log("   🌐 URL: http://localhost:3000/auth/login\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
