import mongoose from "mongoose";
import crypto from "node:crypto";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduplexo";
const SCHOOL_ID = process.env.SCHOOL_ID || "default-school";
const ACADEMIC_YEAR_LABEL = process.env.ACADEMIC_YEAR || "2025-2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "school@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Test@123";

// Requested dataset sizes
const CLASS_COUNT = Number(process.env.CLASS_COUNT || 20);
const TEACHER_COUNT = Number(process.env.TEACHER_COUNT || 25);
const STUDENT_COUNT = Number(process.env.STUDENT_COUNT || 500);

const SUBJECTS = [
    { name: "English", code: "ENG" },
    { name: "Mathematics", code: "MATH" },
    { name: "Science", code: "SCI" },
    { name: "Urdu", code: "URD" },
    { name: "Islamiat", code: "ISL" },
    { name: "Social Studies", code: "SST" },
    { name: "Computer", code: "CS" },
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Biology", code: "BIO" }
];

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const PERIODS = [
    { start_time: "08:00", end_time: "09:00" },
    { start_time: "09:00", end_time: "10:00" },
    { start_time: "10:00", end_time: "11:00" },
    { start_time: "11:00", end_time: "12:00" },
    { start_time: "12:00", end_time: "13:00" }
];
const ATTENDANCE_STATUSES = ["present", "present", "present", "late", "absent"];

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function buildPhone(index) {
    return `0300${String(index).padStart(7, "0")}`;
}

function buildEmail(prefix, index) {
    return `${prefix}${index}@school.local`;
}

function getMondayOfCurrentWeek(date = new Date()) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    result.setHours(0, 0, 0, 0);
    return result;
}

async function bulkWriteIfNeeded(model, operations) {
    if (operations.length > 0) {
        await model.bulkWrite(operations, { ordered: false });
    }
}

async function main() {
    await mongoose.connect(MONGODB_URI, {
        autoIndex: true,
        maxPoolSize: 10
    });

    const schemaOptions = { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, versionKey: false };
    const tenantField = { type: String, required: true, index: true, immutable: true, trim: true };
    const requiredString = { type: String, required: true, trim: true };

    const academicYearSchema = new mongoose.Schema({
        school_id: tenantField,
        year: requiredString,
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
        is_active: { type: Boolean, default: false, index: true },
        description: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["draft", "active", "completed", "cancelled"], default: "draft", index: true }
    }, { ...schemaOptions, collection: "academic_years" });

    const subjectSchema = new mongoose.Schema({
        school_id: tenantField,
        name: requiredString,
        code: { type: String, trim: true },
        description: { type: String, trim: true },
        status: { type: String, enum: ["active", "inactive"], default: "active", index: true }
    }, { ...schemaOptions, collection: "subjects" });

    const classSchema = new mongoose.Schema({
        school_id: tenantField,
        name: requiredString,
        academic_year_id: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
        subject_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject", index: true }],
        subjects: [{ type: String, trim: true }],
        grade: { type: String, trim: true, default: "" },
        section: { type: String, trim: true, default: "" },
        academic_year: { type: String, trim: true, default: "" },
        teacher_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
        room_number: { type: String, trim: true, default: "" },
        description: { type: String, trim: true, default: "" },
        timetable: [{ type: mongoose.Schema.Types.Mixed }],
        status: { type: String, enum: ["active", "archived"], default: "active", index: true }
    }, { ...schemaOptions, collection: "classes" });

    const teacherSchema = new mongoose.Schema({
        school_id: tenantField,
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        employee_no: requiredString,
        first_name: requiredString,
        last_name: { type: String, trim: true, default: "" },
        phone: requiredString,
        qualification: { type: String, trim: true, default: "" },
        subject_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject", index: true }],
        subjects: [{ type: String, trim: true }],
        class_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
        status: { type: String, enum: ["active", "inactive", "on_leave"], default: "active", index: true },
        joined_at: { type: Date, default: Date.now }
    }, { ...schemaOptions, collection: "teachers" });

    const userSchema = new mongoose.Schema({
        school_id: tenantField,
        email: { type: String, required: true, trim: true, lowercase: true },
        password_hash: requiredString,
        role: { type: String, enum: ["super_admin", "admin", "teacher", "parent"], required: true, index: true },
        permissions: [{ type: String, trim: true }],
        profile: {
            first_name: String,
            last_name: String,
            phone: String,
            avatar_url: String
        },
        status: { type: String, enum: ["active", "invited", "disabled", "locked"], default: "active", index: true },
        last_login_at: Date
    }, { ...schemaOptions, collection: "users" });

    const studentSchema = new mongoose.Schema({
        school_id: tenantField,
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        admission_no: requiredString,
        first_name: requiredString,
        last_name: requiredString,
        class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
        subjects: [{ type: String, trim: true }],
        section: { type: String, required: true, trim: true },
        guardian: {
            name: requiredString,
            phone: requiredString,
            email: { type: String, trim: true, lowercase: true }
        },
        status: { type: String, enum: ["active", "inactive", "graduated", "transferred"], default: "active", index: true },
        enrolled_at: { type: Date, default: Date.now }
    }, { ...schemaOptions, collection: "students" });

    const timetableSchema = new mongoose.Schema({
        school_id: tenantField,
        class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
        subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", index: true },
        subject: requiredString,
        day_of_week: { type: Number, min: 1, max: 7, index: true },
        day: { type: String, required: true, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], index: true },
        period_number: { type: Number, min: 1, default: 1 },
        start_time: requiredString,
        end_time: requiredString,
        room: { type: String, trim: true, default: "" }
    }, { ...schemaOptions, collection: "timetable" });

    const attendanceSchema = new mongoose.Schema({
        school_id: tenantField,
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
        class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
        date: { type: Date, required: true, index: true },
        status: { type: String, enum: ["present", "absent", "late", "excused"], required: true, index: true },
        marked_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        source: { type: String, enum: ["manual", "auto", "sync"], default: "manual" },
        note: String
    }, { ...schemaOptions, collection: "attendance" });

    const resultSchema = new mongoose.Schema({
        school_id: tenantField,
        exam_id: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
        class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
        obtained_marks: { type: Number, required: true },
        grade: { type: String, trim: true, default: "" },
        remarks: { type: String, trim: true, default: "" },
        graded_at: { type: Date, default: Date.now }
    }, { ...schemaOptions, collection: "results" });

    const homeworkSchema = new mongoose.Schema({
        school_id: tenantField,
        class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
        subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
        subject: { type: String, trim: true, default: "" },
        title: requiredString,
        instructions: String,
        attachment_urls: [{ type: String, trim: true }],
        max_score: { type: Number, default: 100, min: 0 },
        submission_type: { type: String, enum: ["online", "offline", "both"], default: "both" },
        assigned_at: { type: Date, default: Date.now, index: true },
        due_at: { type: Date, required: true, index: true },
        status: { type: String, enum: ["draft", "assigned", "closed"], default: "assigned", index: true },
        submissions: [{
            student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
            submitted_at: Date,
            status: { type: String, enum: ["pending", "submitted", "late", "missing"], default: "pending" },
            attachment_urls: [{ type: String, trim: true }],
            grade: Number,
            feedback: String
        }]
    }, { ...schemaOptions, collection: "homework" });

    const examSchema = new mongoose.Schema({
        school_id: tenantField,
        class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
        subject: requiredString,
        title: requiredString,
        starts_at: { type: Date, required: true, index: true },
        max_marks: { type: Number, required: true },
        description: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled", index: true },
        marks: [{
            student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
            marks_obtained: Number,
            graded_by: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
            graded_at: Date
        }]
    }, { ...schemaOptions, collection: "exams" });

    const AcademicYear = mongoose.models.AcademicYear || mongoose.model("AcademicYear", academicYearSchema);
    const SubjectModel = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
    const ClassModel = mongoose.models.Class || mongoose.model("Class", classSchema);
    const TeacherModel = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
    const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
    const StudentModel = mongoose.models.Student || mongoose.model("Student", studentSchema);
    const TimetableModel = mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);
    const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
    const HomeworkModel = mongoose.models.Homework || mongoose.model("Homework", homeworkSchema);
    const ExamModel = mongoose.models.Exam || mongoose.model("Exam", examSchema);
    const ResultModel = mongoose.models.Result || mongoose.model("Result", resultSchema);

    const adminUser = await UserModel.findOneAndUpdate(
        { school_id: SCHOOL_ID, email: ADMIN_EMAIL },
        {
            $set: {
                school_id: SCHOOL_ID,
                email: ADMIN_EMAIL,
                password_hash: hashPassword(ADMIN_PASSWORD),
                role: "admin",
                permissions: [],
                profile: { first_name: "Default", last_name: "Admin" },
                status: "active"
            }
        },
        { upsert: true, new: true }
    );

    const existingYear = await AcademicYear.findOne({ school_id: SCHOOL_ID, year: ACADEMIC_YEAR_LABEL });
    const academicYear = existingYear || await AcademicYear.create({
        school_id: SCHOOL_ID,
        year: ACADEMIC_YEAR_LABEL,
        start_date: new Date(`${new Date().getFullYear()}-04-01`),
        end_date: new Date(`${new Date().getFullYear() + 1}-03-31`),
        is_active: true,
        description: `Academic year ${ACADEMIC_YEAR_LABEL}`,
        status: "active"
    });

    const subjectOps = SUBJECTS.map((subject) => ({
        updateOne: {
            filter: { school_id: SCHOOL_ID, name: subject.name },
            update: {
                $set: {
                    school_id: SCHOOL_ID,
                    name: subject.name,
                    code: subject.code,
                    description: `${subject.name} subject`,
                    status: "active"
                }
            },
            upsert: true
        }
    }));
    await bulkWriteIfNeeded(SubjectModel, subjectOps);
    const subjectDocs = await SubjectModel.find({ school_id: SCHOOL_ID }).sort({ name: 1 }).lean();
    const subjectIds = subjectDocs.map((subject) => subject._id);
    const subjectNames = subjectDocs.map((subject) => subject.name);
    const subjectNameById = new Map(subjectDocs.map((subject) => [String(subject._id), subject.name]));

    const classDocs = [];
    for (let index = 1; index <= CLASS_COUNT; index += 1) {
        const name = `Class ${index}`;
        const doc = await ClassModel.findOneAndUpdate(
            { school_id: SCHOOL_ID, name, academic_year_id: academicYear._id },
            {
                $set: {
                    school_id: SCHOOL_ID,
                    name,
                    academic_year_id: academicYear._id,
                    academic_year: ACADEMIC_YEAR_LABEL,
                    grade: String(index),
                    section: "A",
                    room_number: `R-${String(index).padStart(2, "0")}`,
                    description: `Auto-seeded class ${index}`,
                    subjects: subjectNames,
                    subject_ids: subjectIds,
                    teacher_ids: [],
                    status: "active"
                }
            },
            { upsert: true, new: true }
        );
        classDocs.push(doc);
    }

    const teacherOps = [];
    for (let index = 1; index <= TEACHER_COUNT; index += 1) {
        const employeeNo = `T-${String(index).padStart(3, "0")}`;
        teacherOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, employee_no: employeeNo },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        employee_no: employeeNo,
                        first_name: "Teacher",
                        last_name: String(index),
                        phone: buildPhone(index),
                        qualification: "Bachelor of Education",
                        subjects: subjectNames,
                        subject_ids: subjectIds,
                        class_ids: [],
                        status: "active"
                    }
                },
                upsert: true
            }
        });
    }
    await bulkWriteIfNeeded(TeacherModel, teacherOps);
    const teacherDocs = await TeacherModel.find({ school_id: SCHOOL_ID }).sort({ employee_no: 1 }).lean();

    await TimetableModel.deleteMany({ school_id: SCHOOL_ID });
    await AttendanceModel.deleteMany({ school_id: SCHOOL_ID });
    await HomeworkModel.deleteMany({ school_id: SCHOOL_ID });
    await ExamModel.deleteMany({ school_id: SCHOOL_ID });
    await ResultModel.deleteMany({ school_id: SCHOOL_ID });

    const timetableOps = [];
    const classTeacherMap = new Map();
    const classSubjectMap = new Map();
    const teacherClassMap = new Map();
    const teacherSubjectMap = new Map();

    for (const classDoc of classDocs) {
        const classId = String(classDoc._id);
        classTeacherMap.set(classId, new Set());
        classSubjectMap.set(classId, new Set());
    }

    for (const teacherDoc of teacherDocs) {
        const teacherId = String(teacherDoc._id);
        teacherClassMap.set(teacherId, new Set());
        teacherSubjectMap.set(teacherId, new Set());
    }

    classDocs.forEach((classDoc, classIndex) => {
        WEEK_DAYS.forEach((day, dayIndex) => {
            PERIODS.forEach((slot, periodIndex) => {
                const subjectDoc = subjectDocs[(classIndex + dayIndex + periodIndex) % subjectDocs.length];
                const teacherDoc = teacherDocs[(classIndex * 2 + dayIndex * PERIODS.length + periodIndex) % teacherDocs.length];

                const classId = String(classDoc._id);
                const teacherId = String(teacherDoc._id);
                const subjectId = String(subjectDoc._id);

                classTeacherMap.get(classId).add(teacherId);
                classSubjectMap.get(classId).add(subjectId);
                teacherClassMap.get(teacherId).add(classId);
                teacherSubjectMap.get(teacherId).add(subjectId);

                timetableOps.push({
                    updateOne: {
                        filter: {
                            school_id: SCHOOL_ID,
                            class_id: classDoc._id,
                            day,
                            period_number: periodIndex + 1
                        },
                        update: {
                            $set: {
                                school_id: SCHOOL_ID,
                                class_id: classDoc._id,
                                teacher_id: teacherDoc._id,
                                subject_id: subjectDoc._id,
                                subject: subjectDoc.name,
                                day_of_week: dayIndex + 1,
                                day,
                                period_number: periodIndex + 1,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                room: classDoc.room_number || ""
                            }
                        },
                        upsert: true
                    }
                });
            });
        });
    });

    await bulkWriteIfNeeded(TimetableModel, timetableOps);

    const classUpdateOps = classDocs.map((classDoc) => {
        const classId = String(classDoc._id);
        const teacherIdsForClass = [...classTeacherMap.get(classId)];
        const subjectIdsForClass = [...classSubjectMap.get(classId)];
        return {
            updateOne: {
                filter: { _id: classDoc._id },
                update: {
                    $set: {
                        teacher_ids: teacherIdsForClass,
                        subject_ids: subjectIdsForClass,
                        subjects: subjectIdsForClass.map((subjectId) => subjectNameById.get(subjectId)).filter(Boolean)
                    }
                }
            }
        };
    });
    await bulkWriteIfNeeded(ClassModel, classUpdateOps);

    const teacherUpdateOps = teacherDocs.map((teacherDoc) => {
        const teacherId = String(teacherDoc._id);
        const classIdsForTeacher = [...teacherClassMap.get(teacherId)];
        const subjectIdsForTeacher = [...teacherSubjectMap.get(teacherId)];
        return {
            updateOne: {
                filter: { _id: teacherDoc._id },
                update: {
                    $set: {
                        class_ids: classIdsForTeacher,
                        subject_ids: subjectIdsForTeacher,
                        subjects: subjectIdsForTeacher.map((subjectId) => subjectNameById.get(subjectId)).filter(Boolean)
                    }
                }
            }
        };
    });
    await bulkWriteIfNeeded(TeacherModel, teacherUpdateOps);

    const parentUserOps = [];
    const studentOps = [];
    for (let index = 1; index <= STUDENT_COUNT; index += 1) {
        const admissionNo = `S-${String(index).padStart(4, "0")}`;
        const classDoc = classDocs[(index - 1) % classDocs.length];
        const userEmail = buildEmail("student", index);

        parentUserOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, email: userEmail },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        email: userEmail,
                        password_hash: hashPassword("student123"),
                        role: "parent",
                        profile: {
                            first_name: "Student",
                            last_name: String(index)
                        },
                        status: "active"
                    }
                },
                upsert: true
            }
        });

        studentOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, admission_no: admissionNo },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        admission_no: admissionNo,
                        first_name: "Student",
                        last_name: String(index),
                        class_id: classDoc._id,
                        subjects: subjectNames,
                        section: "A",
                        guardian: {
                            name: `Guardian ${index}`,
                            phone: buildPhone(index + 1000),
                            email: buildEmail("guardian", index)
                        },
                        status: "active"
                    }
                },
                upsert: true
            }
        });
    }

    await bulkWriteIfNeeded(UserModel, parentUserOps);
    await bulkWriteIfNeeded(StudentModel, studentOps);

    const studentDocs = await StudentModel.find({ school_id: SCHOOL_ID, admission_no: /^S-/ }).sort({ admission_no: 1 }).lean();
    const weekStart = getMondayOfCurrentWeek(new Date());
    const attendanceDates = Array.from({ length: 5 }, (_, index) => addDays(weekStart, index));
    const attendanceOps = [];

    studentDocs.forEach((studentDoc, studentIndex) => {
        attendanceDates.forEach((date, dayIndex) => {
            const status = ATTENDANCE_STATUSES[(studentIndex + dayIndex) % ATTENDANCE_STATUSES.length];
            attendanceOps.push({
                updateOne: {
                    filter: {
                        school_id: SCHOOL_ID,
                        student_id: studentDoc._id,
                        date
                    },
                    update: {
                        $set: {
                            school_id: SCHOOL_ID,
                            student_id: studentDoc._id,
                            class_id: studentDoc.class_id,
                            date,
                            status,
                            marked_by: adminUser._id,
                            source: "manual",
                            note: status === "present" ? "Seeded attendance" : `Seeded attendance: ${status}`
                        }
                    },
                    upsert: true
                }
            });
        });
    });

    await bulkWriteIfNeeded(AttendanceModel, attendanceOps);

    const homeworkOps = classDocs.map((classDoc, index) => {
        const classId = String(classDoc._id);
        const teacherIdsForClass = [...classTeacherMap.get(classId)];
        const subjectIdsForClass = [...classSubjectMap.get(classId)];
        const teacherId = teacherIdsForClass[0] || teacherDocs[index % teacherDocs.length]._id;
        const subjectId = subjectIdsForClass[0] || subjectDocs[index % subjectDocs.length]._id;
        const subjectName = subjectNameById.get(String(subjectId)) || subjectDocs[index % subjectDocs.length].name;
        const dueAt = addDays(new Date(), 3 + (index % 4));

        return {
            updateOne: {
                filter: { school_id: SCHOOL_ID, class_id: classDoc._id, title: `Homework ${index + 1}` },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        class_id: classDoc._id,
                        teacher_id: teacherId,
                        subject_id: subjectId,
                        subject: subjectName,
                        title: `Homework ${index + 1}`,
                        instructions: `Complete the assigned work for ${classDoc.name} in ${subjectName}.`,
                        attachment_urls: [],
                        max_score: 100,
                        submission_type: "both",
                        assigned_at: new Date(),
                        due_at: dueAt,
                        status: "assigned",
                        submissions: []
                    }
                },
                upsert: true
            }
        };
    });
    await bulkWriteIfNeeded(HomeworkModel, homeworkOps);

    const examOps = classDocs.map((classDoc, index) => {
        const classId = String(classDoc._id);
        const teacherIdsForClass = [...classTeacherMap.get(classId)];
        const subjectIdsForClass = [...classSubjectMap.get(classId)];
        const teacherId = teacherIdsForClass[1] || teacherIdsForClass[0] || teacherDocs[(index + 1) % teacherDocs.length]._id;
        const subjectId = subjectIdsForClass[1] || subjectIdsForClass[0] || subjectDocs[(index + 1) % subjectDocs.length]._id;
        const subjectName = subjectNameById.get(String(subjectId)) || subjectDocs[(index + 1) % subjectDocs.length].name;
        const startsAt = addDays(new Date(), 10 + index);

        return {
            updateOne: {
                filter: { school_id: SCHOOL_ID, class_id: classDoc._id, title: `Exam ${index + 1}` },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        class_id: classDoc._id,
                        subject: subjectName,
                        title: `Exam ${index + 1}`,
                        starts_at: startsAt,
                        max_marks: 100,
                        description: `Scheduled exam for ${classDoc.name} in ${subjectName}.`,
                        status: "scheduled",
                        marks: []
                    }
                },
                upsert: true
            }
        };
    });
    await bulkWriteIfNeeded(ExamModel, examOps);

    const examDocs = await ExamModel.find({ school_id: SCHOOL_ID }).sort({ starts_at: 1 }).lean();
    const studentByClass = new Map();
    studentDocs.forEach((studentDoc) => {
        const classId = String(studentDoc.class_id);
        if (!studentByClass.has(classId)) {
            studentByClass.set(classId, []);
        }
        studentByClass.get(classId).push(studentDoc);
    });

    const resultGrade = (obtainedMarks, maxMarks) => {
        const ratio = maxMarks > 0 ? obtainedMarks / maxMarks : 0;
        if (ratio >= 0.9) return "A+";
        if (ratio >= 0.8) return "A";
        if (ratio >= 0.7) return "B";
        if (ratio >= 0.6) return "C";
        if (ratio >= 0.5) return "D";
        return "F";
    };

    const resultOps = [];
    examDocs.forEach((examDoc, examIndex) => {
        const classId = String(examDoc.class_id);
        const studentsInClass = studentByClass.get(classId) || [];
        studentsInClass.forEach((studentDoc, studentIndex) => {
            const baseMarks = 45 + ((examIndex * 13 + studentIndex * 7) % 56);
            const obtainedMarks = Math.min(Number(examDoc.max_marks || 100), baseMarks);
            resultOps.push({
                updateOne: {
                    filter: {
                        school_id: SCHOOL_ID,
                        exam_id: examDoc._id,
                        student_id: studentDoc._id
                    },
                    update: {
                        $set: {
                            school_id: SCHOOL_ID,
                            exam_id: examDoc._id,
                            class_id: examDoc.class_id,
                            student_id: studentDoc._id,
                            obtained_marks: obtainedMarks,
                            grade: resultGrade(obtainedMarks, Number(examDoc.max_marks || 100)),
                            remarks: obtainedMarks >= 75 ? "Excellent performance" : obtainedMarks >= 60 ? "Good effort" : "Needs improvement",
                            graded_at: addDays(new Date(), 14 + examIndex)
                        }
                    },
                    upsert: true
                }
            });
        });
    });

    await bulkWriteIfNeeded(ResultModel, resultOps);

    await bulkWriteIfNeeded(ResultModel, resultOps);

    // --- Create teacher user accounts and link to teacher docs ---
    const teacherUserOps = [];
    teacherDocs.forEach((teacherDoc, idx) => {
        const email = buildEmail("teacher", idx + 1);
        teacherUserOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, email },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        email,
                        password_hash: hashPassword("teacher123"),
                        role: "teacher",
                        profile: { first_name: "Teacher", last_name: String(idx + 1) },
                        status: "active"
                    }
                },
                upsert: true
            }
        });
    });
    await bulkWriteIfNeeded(UserModel, teacherUserOps);

    const teacherUserDocs = await UserModel.find({ school_id: SCHOOL_ID, email: /^teacher/ }).lean();
    const teacherUserByEmail = new Map(teacherUserDocs.map((u) => [u.email, u._id]));

    const teacherUpdateUserOps = teacherDocs.map((t, idx) => {
        const email = buildEmail("teacher", idx + 1);
        const userId = teacherUserByEmail.get(email);
        if (!userId) return null;
        return {
            updateOne: {
                filter: { _id: t._id },
                update: { $set: { user_id: userId } }
            }
        };
    }).filter(Boolean);
    await bulkWriteIfNeeded(TeacherModel, teacherUpdateUserOps);

    // Create explicit test accounts requested by the user
    const testTeacherUser = await UserModel.findOneAndUpdate(
        { school_id: SCHOOL_ID, email: "teacher@gmail.com" },
        {
            $set: {
                school_id: SCHOOL_ID,
                email: "teacher@gmail.com",
                password_hash: hashPassword("Test@123"),
                role: "teacher",
                profile: { first_name: "Test", last_name: "Teacher" },
                status: "active"
            }
        },
        { upsert: true, new: true }
    );

    const testStudentUser = await UserModel.findOneAndUpdate(
        { school_id: SCHOOL_ID, email: "student@gmail.com" },
        {
            $set: {
                school_id: SCHOOL_ID,
                email: "student@gmail.com",
                password_hash: hashPassword("Test@123"),
                role: "parent",
                profile: { first_name: "Test", last_name: "Student" },
                status: "active"
            }
        },
        { upsert: true, new: true }
    );

    // Link the test teacher to the first teacher doc, if exists
    if (teacherDocs.length > 0 && testTeacherUser?._id) {
        await TeacherModel.findByIdAndUpdate(teacherDocs[0]._id, { $set: { user_id: testTeacherUser._id } });
    }

    // Link the test student to the first student doc, if exists
    if (studentDocs.length > 0 && testStudentUser?._id) {
        await StudentModel.findByIdAndUpdate(studentDocs[0]._id, { $set: { user_id: testStudentUser._id } });
    }

    // --- Seed Fees: one invoice per student ---
    const FeeModel = mongoose.models.Fee || mongoose.model("Fee", new mongoose.Schema({}, { strict: false, collection: "fees" }));
    const feeOps = [];
    studentDocs.forEach((studentDoc, idx) => {
        const invoiceNo = `${SCHOOL_ID}-INV-${String(idx + 1).padStart(6, "0")}`;
        const amount = 500 + (idx % 10) * 25;
        feeOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, invoice_no: invoiceNo },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        student_id: studentDoc._id,
                        class_id: studentDoc.class_id,
                        academic_year_id: academicYear._id,
                        invoice_no: invoiceNo,
                        title: `Tuition Fee ${academicYear.year}`,
                        amount,
                        currency: "USD",
                        due_at: addDays(new Date(), 15 + (idx % 30)),
                        status: idx % 3 === 0 ? "paid" : "unpaid",
                        paid_amount: idx % 3 === 0 ? amount : 0,
                        generated_by: adminUser._id
                    }
                },
                upsert: true
            }
        });
    });
    await bulkWriteIfNeeded(FeeModel, feeOps);

    // --- Seed Behavior incidents ---
    const BehaviorModel = mongoose.models.Behavior || mongoose.model("Behavior", new mongoose.Schema({}, { strict: false, collection: "behavior" }));
    const behaviorOps = [];
    for (let i = 0; i < Math.min(100, studentDocs.length); i += 1) {
        const student = studentDocs[i];
        const teacher = teacherDocs[i % teacherDocs.length];
        behaviorOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, student_id: student._id, incident_type: "conduct", description: `Behavior incident ${i + 1}` },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        student_id: student._id,
                        class_id: student.class_id,
                        teacher_id: teacher._id,
                        incident_type: "conduct",
                        description: `Auto-seeded incident ${i + 1}`,
                        severity: i % 4 === 0 ? "major" : "minor",
                        action_taken: "Counseling",
                        status: "open",
                        warning_count: 1,
                        parent_notified: false
                    }
                },
                upsert: true
            }
        });
    }
    await bulkWriteIfNeeded(BehaviorModel, behaviorOps);

    // --- Seed Leaves for some teachers and students ---
    const LeaveModel = mongoose.models.Leave || mongoose.model("Leave", new mongoose.Schema({}, { strict: false, collection: "leaves" }));
    const leaveOps = [];
    // Teacher leaves
    for (let i = 0; i < Math.min(10, teacherDocs.length); i += 1) {
        const teacher = teacherDocs[i];
        leaveOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, requester_type: "teacher", requester_id: teacher._id, start_date: addDays(new Date(), i + 1) },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        requester_type: "teacher",
                        requester_id: teacher._id,
                        requester_name: `${teacher.first_name || "Teacher"} ${teacher.last_name || ""}`.trim(),
                        leave_type: "personal",
                        reason: "Auto-seeded leave",
                        start_date: addDays(new Date(), i + 1),
                        end_date: addDays(new Date(), i + 2),
                        status: "approved",
                        approved_by: adminUser._id,
                        approved_at: new Date()
                    }
                },
                upsert: true
            }
        });
    }
    // Student leaves
    for (let i = 0; i < Math.min(20, studentDocs.length); i += 1) {
        const student = studentDocs[i];
        leaveOps.push({
            updateOne: {
                filter: { school_id: SCHOOL_ID, requester_type: "student", requester_id: student._id, start_date: addDays(new Date(), i + 3) },
                update: {
                    $set: {
                        school_id: SCHOOL_ID,
                        requester_type: "student",
                        requester_id: student._id,
                        requester_name: `${student.first_name || "Student"} ${student.last_name || ""}`.trim(),
                        leave_type: "sick",
                        reason: "Auto-seeded student leave",
                        start_date: addDays(new Date(), i + 3),
                        end_date: addDays(new Date(), i + 4),
                        status: "pending"
                    }
                },
                upsert: true
            }
        });
    }
    await bulkWriteIfNeeded(LeaveModel, leaveOps);

    console.log(
        `Seeded ${CLASS_COUNT} classes, ${TEACHER_COUNT} teachers, ${SUBJECTS.length} subjects, ${STUDENT_COUNT} students, ${classDocs.length * WEEK_DAYS.length * PERIODS.length} timetable entries, ${studentDocs.length * attendanceDates.length} attendance records, ${homeworkOps.length} homework items, ${examOps.length} exams, ${resultOps.length} results, ${feeOps.length} fees, ${behaviorOps.length} behavior incidents, ${leaveOps.length} leaves for ${SCHOOL_ID}.`
    );

    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error("Seed failed:", error);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore disconnect errors
    }
    process.exit(1);
});
