import { Types, isValidObjectId } from "mongoose";
import { connectDb } from "../db/connect";
import { tenantFilter, academicYearFilter } from "../db/tenant-query";
import { TeacherModel } from "../models/teacher.model";
import { SchoolModel } from "../models/school.model";
import { AcademicYearModel } from "../models/academic-year.model";
import { ClassModel } from "../models/class.model";
import { StudentModel } from "../models/student.model";
import { TimetableModel } from "../models/timetable.model";
import { AttendanceModel } from "../models/attendance.model";
import { AnnouncementDocModel as AnnouncementModel } from "../models/announcement.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";

function getMockTeacherData(ctx: RequestContext) {
  console.log('🔧 Returning mock teacher data');
  return {
    teacher: {
      id: "mock-teacher-id",
      employee_no: "EMP-001",
      first_name: "Demo",
      last_name: "Teacher",
      email: ctx.actor_email || "teacher@example.com",
      qualification: "M.Ed",
      status: "active"
    },
    school: {
      name: "Eduplexo School",
      session: "2024-25"
    },
    alerts: [],
    stats: {
      totalClasses: 3,
      totalStudents: 75,
      pendingAttendance: 1,
      todayLectures: 4,
      upcomingExams: 2
    },
    operationalStats: {
      todayAttendance: { total: 3, marked: 2 },
      pendingGrading: 5,
      homeworkStatus: { pending: 3 }
    },
    classes: [
      {
        id: "mock-class-1",
        name: "Class 10-A",
        section: "A",
        capacity: 30,
        academic_year: "2024-25",
        enrolled_students: 28,
        lectures_today: 2,
        attendance_pending: true,
        upcoming_exams: 1,
        pending_assignments: 2,
        students_preview: [
          { id: "s1", name: "Ahmed Ali" },
          { id: "s2", name: "Fatima Khan" },
          { id: "s3", name: "Hassan Raza" },
          { id: "s4", name: "Ayesha Malik" },
          { id: "s5", name: "Usman Ahmed" }
        ]
      },
      {
        id: "mock-class-2",
        name: "Class 9-B",
        section: "B",
        capacity: 35,
        academic_year: "2024-25",
        enrolled_students: 32,
        lectures_today: 1,
        attendance_pending: false,
        upcoming_exams: 1,
        pending_assignments: 1,
        students_preview: [
          { id: "s6", name: "Sara Ahmed" },
          { id: "s7", name: "Ali Hassan" },
          { id: "s8", name: "Zainab Ali" },
          { id: "s9", name: "Bilal Khan" },
          { id: "s10", name: "Maryam Fatima" }
        ]
      },
      {
        id: "mock-class-3",
        name: "Class 8-A",
        section: "A",
        capacity: 25,
        academic_year: "2024-25",
        enrolled_students: 15,
        lectures_today: 1,
        attendance_pending: false,
        upcoming_exams: 0,
        pending_assignments: 0,
        students_preview: [
          { id: "s11", name: "Hamza Ali" },
          { id: "s12", name: "Aisha Khan" },
          { id: "s13", name: "Omar Farooq" }
        ]
      }
    ],
    todaySchedule: [
      {
        id: "mock-class-1",
        start_time: "09:00",
        end_time: "10:00",
        class_name: "Class 10-A",
        subject_name: "Mathematics",
        room: "Room 101",
        attendance_marked: false
      },
      {
        id: "mock-class-2",
        start_time: "10:00",
        end_time: "11:00",
        class_name: "Class 9-B",
        subject_name: "English",
        room: "Room 102",
        attendance_marked: true
      },
      {
        id: "mock-class-1",
        start_time: "11:00",
        end_time: "12:00",
        class_name: "Class 10-A",
        subject_name: "Physics",
        room: "Room 101",
        attendance_marked: false
      },
      {
        id: "mock-class-3",
        start_time: "14:00",
        end_time: "15:00",
        class_name: "Class 8-A",
        subject_name: "Science",
        room: "Room 103",
        attendance_marked: true
      }
    ],
    announcements: [
      {
        id: "a1",
        title: "Parent-Teacher Meeting",
        message: "Scheduled for next Friday at 3 PM",
        date: new Date()
      },
      {
        id: "a2",
        title: "Exam Schedule Released",
        message: "Mid-term exams will start from next week",
        date: new Date()
      }
    ]
  };
}

export async function getTeacherDashboardData(ctx: RequestContext, teacherId: string): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    console.log('\n🔍 getTeacherDashboardData called');
    console.log('🔍 Teacher ID:', teacherId);
    console.log('🔍 Context:', { school_id: ctx.school_id, user_id: ctx.user_id, role: ctx.role });
    
    await connectDb();
    
    const devMode = process.env.NODE_ENV === "development";
    let effectiveCtx = ctx;

    // Resolve school in dev mode
    if (devMode && (ctx.school_id === "dev-school-id" || !ctx.school_id)) {
        console.log('🔧 Dev mode: Resolving fallback school...');
        const fallbackSchool = (await SchoolModel.findOne().select("school_id").lean()) as any;
        const targetSchoolId = fallbackSchool?.school_id || "default-school";
        console.log('🔧 Fallback school ID:', targetSchoolId);
        
        const fallbackAcademicYear = await AcademicYearModel.findOne({ school_id: targetSchoolId }).sort({ is_active: -1, _id: 1 }).select("_id").lean() as any;

        effectiveCtx = {
            ...ctx,
            school_id: targetSchoolId,
            active_academic_year_id: fallbackAcademicYear ? String(fallbackAcademicYear._id) : ctx.active_academic_year_id
        };
    }

    const filter = tenantFilter(effectiveCtx);
    const ayFilter = academicYearFilter(effectiveCtx);
    
    // Resolve teacher
    let realTeacherId = teacherId;
    let teacher: any = null;

    console.log('🔍 Resolving teacher profile...');
    if (teacherId === "session") {
      console.log('🔍 Using session-based lookup');
      if (isValidObjectId(effectiveCtx.user_id)) {
        console.log('🔍 Looking up by user_id:', effectiveCtx.user_id);
        teacher = await TeacherModel.findOne({ ...filter, user_id: new Types.ObjectId(effectiveCtx.user_id) }).lean();
        console.log('🔍 Teacher found by user_id:', !!teacher);
      }

      if (!teacher && devMode) {
        console.log('🔧 Dev mode: Using first teacher in database');
        teacher = await TeacherModel.findOne(filter).sort({ joined_at: 1, _id: 1 }).lean();
        console.log('🔧 Fallback teacher found:', !!teacher);
      }

      if (!teacher) {
        console.error('❌ No teacher profile found');
        console.log('🔧 Returning mock data');
        return getMockTeacherData(effectiveCtx);
      }
      
      realTeacherId = String(teacher._id);
      console.log('✅ Teacher resolved:', realTeacherId);
    } else {
      const teacherQuery = isValidObjectId(realTeacherId) ? { ...filter, _id: realTeacherId } : filter;
      teacher = await TeacherModel.findOne(teacherQuery).sort({ joined_at: 1, _id: 1 }).lean();
      
      if (!teacher) {
        console.error('❌ Teacher not found by ID');
        console.log('🔧 Returning mock data');
        return getMockTeacherData(effectiveCtx);
      }
      
      realTeacherId = String(teacher._id);
    }

    console.log('👨‍🏫 Teacher:', { id: realTeacherId, name: `${teacher.first_name} ${teacher.last_name}` });

    // Fetch dependencies
    const school = (await SchoolModel.findOne({ school_id: effectiveCtx.school_id }).select("name").lean()) as any;
    const ay = (effectiveCtx.active_academic_year_id
      ? await AcademicYearModel.findOne({
          school_id: effectiveCtx.school_id,
          _id: effectiveCtx.active_academic_year_id
        }).select("year").lean()
      : null) as any;

    // Today's schedule
    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    const schedules = await TimetableModel.find({
      ...ayFilter,
      teacher_id: realTeacherId,
      day: dayName
    }).populate("class_id", "name").sort({ start_time: 1 }).lean();

    const todayAttendance = await AttendanceModel.find({
      ...ayFilter,
      teacher_id: realTeacherId,
      date: { $gte: todayStart, $lt: todayEnd }
    }).select("class_id").lean();

    const markedClassIds = new Set(todayAttendance.map(a => String(a.class_id)));

    // Find assigned classes
    const timetableClassIds = await TimetableModel.find({ ...ayFilter, teacher_id: realTeacherId }).distinct("class_id");
    console.log('📚 Timetable class IDs:', timetableClassIds.length);
    
    const assignedClasses = await ClassModel.find({ 
      ...ayFilter, 
      status: "active",
      $or: [
        { _id: { $in: teacher.class_ids || [] } },
        { _id: { $in: timetableClassIds } },
        { teacher_ids: teacher._id },
        { class_teacher_id: teacher._id },
        { "subjects.teacher_id": teacher._id }
      ]
    }).lean();
    
    console.log('📚 Assigned classes found:', assignedClasses.length);

    const classesWithCounts = await Promise.all(assignedClasses.map(async (cls) => {
      const studentCount = await StudentModel.countDocuments({ ...ayFilter, class_id: cls._id });
      const studentsPreview = await StudentModel.find({ ...filter, class_id: cls._id }).limit(5).select("first_name last_name").lean();
      
      const attendanceForClassToday = markedClassIds.has(String(cls._id));

      return {
        id: String(cls._id),
        name: cls.name,
        section: cls.section || "A",
        capacity: (cls as any).capacity || 0,
        academic_year: ay?.year || "Current",
        enrolled_students: studentCount,
        lectures_today: schedules.filter(s => String((s.class_id as any)?._id || s.class_id) === String(cls._id)).length,
        attendance_pending: !attendanceForClassToday,
        upcoming_exams: 0,
        pending_assignments: 0,
        students_preview: studentsPreview.map(s => ({
            id: String(s._id),
            name: `${s.first_name} ${s.last_name}`
        }))
      };
    }));

    const todaySchedule = schedules.map(s => ({
      id: String((s.class_id as any)?._id || s.class_id),
      start_time: s.start_time,
      end_time: s.end_time,
      class_name: (s.class_id as any)?.name || "N/A",
      subject_name: (s as any).subject || "N/A",
      room: (s as any).room || "N/A",
      attendance_marked: markedClassIds.has(String((s.class_id as any)?._id || s.class_id))
    }));

    const totalClassesToday = new Set(schedules.map(s => String((s.class_id as any)?._id || s.class_id))).size;
    const markedClassesToday = markedClassIds.size;
    const announcements = await AnnouncementModel.find(filter).sort({ createdAt: -1 }).limit(5).lean();
    const totalStudents = classesWithCounts.reduce((acc, c) => acc + c.enrolled_students, 0);

    console.log('✅ Dashboard data prepared');
    console.log('✅ Classes:', classesWithCounts.length);
    console.log('✅ Total students:', totalStudents);

    return {
      teacher: {
        id: String(teacher._id),
        employee_no: teacher.employee_no || "EMP-001",
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        qualification: teacher.qualification || "N/A",
        status: teacher.status || "active"
      },
      school: {
        name: school?.name || "Eduplexo School",
        session: ay?.year || "2024-25"
      },
      alerts: [],
      stats: {
        totalClasses: classesWithCounts.length,
        totalStudents,
        pendingAttendance: Math.max(0, totalClassesToday - markedClassesToday),
        todayLectures: schedules.length,
        upcomingExams: 0 
      },
      operationalStats: {
        todayAttendance: { total: totalClassesToday, marked: markedClassesToday },
        pendingGrading: 0,
        homeworkStatus: { pending: 0 }
      },
      classes: classesWithCounts,
      todaySchedule,
      announcements: announcements.map(a => ({
        id: String(a._id),
        title: a.title,
        message: (a as any).content || (a as any).message,
        date: (a as any).createdAt || new Date()
      }))
    };
  });
}
