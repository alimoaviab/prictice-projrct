/**
 * Comprehensive Demo Data Seeding Script
 * Creates:
 * - 500 Schools
 * - 20 Classes per school
 * - 20 Teachers per school
 * - 30 Students per class
 * - Attendance records
 * - Homework assignments
 * - Exam results
 * - Fee records
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

const userSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin", "teacher", "parent", "student"], required: true, index: true },
    permissions: [{ type: String, trim: true }],
    profile: { first_name: String, last_name: String, phone: String, avatar_url: String },
    status: { type: String, enum: ["active", "invited", "disabled", "locked"], default: "active", index: true },
    last_login_at: Date,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "users" }
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

userSchema.index({ school_id: 1, email: 1 }, { unique: true });

const SchoolModel = mongoose.models.School || mongoose.model("School", schoolSchema);
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const ClassModel = mongoose.models.Class || mongoose.model("Class", classSchema);
const StudentModel = mongoose.models.Student || mongoose.model("Student", studentSchema);
const TeacherModel = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
const HomeworkModel = mongoose.models.Homework || mongoose.model("Homework", homeworkSchema);
const ExamModel = mongoose.models.Exam || mongoose.model("Exam", examSchema);
const ResultModel = mongoose.models.Result || mongoose.model("Result", resultSchema);
const FeeModel = mongoose.models.Fee || mongoose.model("Fee", feeSchema);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

async function seedData() {
  try {
    console.log("\n🌱 Starting Comprehensive Demo Data Seeding...\n");
    console.log(`📦 MongoDB: ${MONGODB_URI}`);
    console.log("Connecting to database...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    // Check if data already exists
    const existingSchools = await SchoolModel.countDocuments();
    if (existingSchools > 1) {
      console.log(`⚠️  Found ${existingSchools} schools. Skipping seeding to avoid duplicates.`);
      console.log("To reseed, delete existing data first.\n");
      await mongoose.disconnect();
      process.exit(0);
    }

    const TOTAL_SCHOOLS = 500;
    const CLASSES_PER_SCHOOL = 20;
    const TEACHERS_PER_SCHOOL = 20;
    const STUDENTS_PER_CLASS = 30;

    console.log(`📊 Seeding Plan:`);
    console.log(`   • ${TOTAL_SCHOOLS} Schools`);
    console.log(`   • ${CLASSES_PER_SCHOOL} Classes per school`);
    console.log(`   • ${TEACHERS_PER_SCHOOL} Teachers per school`);
    console.log(`   • ${STUDENTS_PER_CLASS} Students per class`);
    console.log(`   • Attendance records`);
    console.log(`   • Homework assignments`);
    console.log(`   • Exam results\n`);

    const subjects = ["Mathematics", "English", "Science", "History", "Geography", "Computer Science", "Urdu", "Islamic Studies"];
    const classNames = ["A", "B", "C", "D", "E"];
    const firstNames = ["Ahmed", "Ali", "Fatima", "Ayesha", "Hassan", "Zainab", "Muhammad", "Sara", "Omar", "Noor"];
    const lastNames = ["Khan", "Ahmed", "Hassan", "Ali", "Shah", "Malik", "Hussain", "Raza", "Siddiqui", "Mirza"];

    let totalRecords = 0;

    // Seed Schools
    console.log("🏫 Creating schools...");
    const schools = [];
    for (let i = 1; i <= TOTAL_SCHOOLS; i++) {
      const schoolId = `SCHOOL_${String(i).padStart(4, "0")}`;
      const school = await SchoolModel.create({
        school_id: schoolId,
        name: `${generateRandomString(6).toUpperCase()} School`,
        code: `SC${String(i).padStart(4, "0")}`,
        status: "approved",
        admin_profile: {
          name: `Admin ${i}`,
          email: `admin${i}@school.com`,
          phone: `+92-300-${String(i).padStart(7, "0")}`,
        },
        plan: { key: "premium", seats: 500 },
      });
      schools.push(school);
      totalRecords++;

      if (i % 100 === 0) console.log(`   ✓ Created ${i}/${TOTAL_SCHOOLS} schools`);
    }
    console.log(`✅ Created ${TOTAL_SCHOOLS} schools\n`);

    // Seed Classes, Teachers, Students, and related data
    console.log("👥 Creating classes, teachers, and students...");
    let schoolCount = 0;

    for (const school of schools) {
      schoolCount++;
      const classes = [];
      const teachers = [];

      // Create classes
      for (let c = 0; c < CLASSES_PER_SCHOOL; c++) {
        const className = `${classNames[c % classNames.length]}-${Math.floor(c / classNames.length) + 1}`;
        const classDoc = await ClassModel.create({
          school_id: school.school_id,
          name: className,
          section: classNames[c % classNames.length],
          capacity: STUDENTS_PER_CLASS,
        });
        classes.push(classDoc);
      }

      // Create teachers
      for (let t = 0; t < TEACHERS_PER_SCHOOL; t++) {
        const firstName = firstNames[t % firstNames.length];
        const lastName = lastNames[t % lastNames.length];
        const subject = subjects[t % subjects.length];
        const email = `teacher${t}@${school.school_id.toLowerCase()}.com`;

        const teacher = await TeacherModel.create({
          school_id: school.school_id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: `+92-300-${generateRandomString(7)}`,
          subject: subject,
          qualification: "Bachelor's Degree",
          status: "active",
        });
        teachers.push(teacher);
      }

      // Create students and related records
      for (const classDoc of classes) {
        for (let s = 0; s < STUDENTS_PER_CLASS; s++) {
          const firstName = firstNames[s % firstNames.length];
          const lastName = lastNames[s % lastNames.length];
          const admissionNo = `${school.school_id}-${classDoc._id.toString().slice(-4)}-${String(s).padStart(3, "0")}`;

          const student = await StudentModel.create({
            school_id: school.school_id,
            class_id: classDoc._id,
            admission_no: admissionNo,
            first_name: firstName,
            last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.com`,
            phone: `+92-300-${generateRandomString(7)}`,
            date_of_birth: new Date(2010 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: Math.random() > 0.5 ? "Male" : "Female",
            status: "active",
          });

          // Create attendance records (last 30 days)
          for (let d = 0; d < 30; d++) {
            const date = new Date();
            date.setDate(date.getDate() - d);
            if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
              await AttendanceModel.create({
                school_id: school.school_id,
                class_id: classDoc._id,
                student_id: student._id,
                date: date,
                status: Math.random() > 0.1 ? "present" : (Math.random() > 0.5 ? "absent" : "late"),
                marked_by: teachers[0]._id,
              });
            }
          }

          // Create fee records
          await FeeModel.create({
            school_id: school.school_id,
            class_id: classDoc._id,
            student_id: student._id,
            amount: 5000 + Math.random() * 5000,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: ["pending", "partial", "paid"][Math.floor(Math.random() * 3)],
          });

          totalRecords += 32; // 1 student + 30 attendance + 1 fee
        }

        // Create homework for each class
        for (let h = 0; h < 5; h++) {
          await HomeworkModel.create({
            school_id: school.school_id,
            class_id: classDoc._id,
            teacher_id: teachers[h % teachers.length]._id,
            title: `Homework ${h + 1}`,
            description: `Complete exercises from chapter ${h + 1}`,
            due_date: new Date(Date.now() + (h + 1) * 24 * 60 * 60 * 1000),
            subject: subjects[h % subjects.length],
            status: "active",
          });
        }

        // Create exams for each class
        for (let e = 0; e < 3; e++) {
          const exam = await ExamModel.create({
            school_id: school.school_id,
            class_id: classDoc._id,
            title: `Exam ${e + 1}`,
            subject: subjects[e % subjects.length],
            date: new Date(Date.now() + (e + 1) * 7 * 24 * 60 * 60 * 1000),
            total_marks: 100,
            status: "scheduled",
          });

          // Create results for each student
          const classStudents = await StudentModel.find({ class_id: classDoc._id });
          for (const student of classStudents) {
            const marks = Math.floor(Math.random() * 100);
            await ResultModel.create({
              school_id: school.school_id,
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

      if (schoolCount % 50 === 0) {
        console.log(`   ✓ Processed ${schoolCount}/${TOTAL_SCHOOLS} schools`);
      }
    }

    console.log(`✅ Created all classes, teachers, and students\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SEEDING COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Total Records Created: ${totalRecords + (TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * TEACHERS_PER_SCHOOL * STUDENTS_PER_CLASS * 32)}`);
    console.log(`🏫 Schools: ${TOTAL_SCHOOLS}`);
    console.log(`📚 Classes: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL}`);
    console.log(`👨‍🏫 Teachers: ${TOTAL_SCHOOLS * TEACHERS_PER_SCHOOL}`);
    console.log(`👨‍🎓 Students: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * STUDENTS_PER_CLASS}`);
    console.log(`📋 Attendance Records: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * STUDENTS_PER_CLASS * 30}`);
    console.log(`💰 Fee Records: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * STUDENTS_PER_CLASS}`);
    console.log(`📝 Homework Assignments: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * 5}`);
    console.log(`📊 Exams: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * 3}`);
    console.log(`📈 Results: ${TOTAL_SCHOOLS * CLASSES_PER_SCHOOL * 3 * STUDENTS_PER_CLASS}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
