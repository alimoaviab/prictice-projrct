import { Types, isValidObjectId } from "mongoose";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
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

export async function getTeacherDashboardData(ctx: RequestContext, teacherId: string): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    await connectDb();
    
    const devMode = process.env.NODE_ENV === "development";
    let effectiveCtx = ctx;

    if (devMode && ctx.school_id === "dev-school-id") {
        const fallbackSchool = (await SchoolModel.findOne().select("school_id").lean()) as any;
        const fallbackAcademicYear = fallbackSchool
          ? (await AcademicYearModel.findOne({ school_id: fallbackSchool.school_id }).sort({ is_active: -1, _id: 1 }).select("_id").lean()) as any
          : null;

        if (fallbackSchool?.school_id) {
            effectiveCtx = {
                ...ctx,
                school_id: fallbackSchool.school_id,
                active_academic_year_id: fallbackAcademicYear ? String(fallbackAcademicYear._id) : ctx.active_academic_year_id
            };
        }
    }

    const filter = tenantFilter(effectiveCtx);
    
    // Resolve teacher if ID is "session"
    let realTeacherId = teacherId;
    if (teacherId === "session") {
    let teacher = null;

      if (isValidObjectId(effectiveCtx.user_id)) {
        teacher = (await TeacherModel.findOne({ ...filter, user_id: new Types.ObjectId(effectiveCtx.user_id) }).select("_id").lean()) as any;
    }

      if (!teacher && devMode) {
      teacher = (await TeacherModel.findOne(filter).sort({ joined_at: 1, _id: 1 }).select("_id").lean()) as any;
    }

    if (!teacher) throw new Error("Teacher profile not found for current session.");
    realTeacherId = String(teacher._id);
    }

    const teacherQuery = isValidObjectId(realTeacherId)
    ? { ...filter, _id: realTeacherId }
      : devMode
    ? filter
    : { ...filter, _id: realTeacherId };

    const teacher = (await TeacherModel.findOne(teacherQuery).sort({ joined_at: 1, _id: 1 }).lean()) as any;
    if (!teacher) throw new Error("Teacher profile not found");

    const school = (await SchoolModel.findOne({ school_id: effectiveCtx.school_id }).select("name").lean()) as any;
    const ay = (effectiveCtx.active_academic_year_id
      ? await AcademicYearModel.findById(effectiveCtx.active_academic_year_id).select("year").lean()
      : null) as any;

    // 1. Assigned Classes
    const assignedClasses = await ClassModel.find({ 
      ...filter, 
      _id: { $in: (teacher as any).class_ids || [] } 
    }).lean();

    const classesWithCounts = await Promise.all(assignedClasses.map(async (cls) => {
      const studentCount = await StudentModel.countDocuments({ ...filter, class_id: cls._id });
      return {
        id: String(cls._id),
        name: cls.name,
        section: cls.section || "A",
        studentCount,
        pendingHomework: 0,
        upcomingExams: 0,
        academicYear: ay?.year || "Current"
      };
    }));

    // 2. Today's Timetable
    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    
    const schedules = await TimetableModel.find({
      ...filter,
      teacher_id: realTeacherId,
      day: dayName
    }).populate("class_id", "name").sort({ start_time: 1 }).lean();

    // Check attendance for today's classes
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    const todayAttendance = await AttendanceModel.find({
      ...filter,
      teacher_id: realTeacherId,
      date: { $gte: todayStart, $lt: todayEnd }
    }).select("class_id").lean();

    const markedClassIds = new Set(todayAttendance.map(a => String(a.class_id)));

    const todaySchedule = schedules.map(s => ({
      id: String((s.class_id as any)?._id || s.class_id),
      start_time: s.start_time,
      end_time: s.end_time,
      class_name: (s.class_id as any)?.name || "N/A",
      subject_name: (s as any).subject || "N/A",
      room: (s as any).room || "N/A",
      attendance_marked: markedClassIds.has(String((s.class_id as any)?._id || s.class_id))
    }));

    // 3. Operational Stats
    const totalClassesToday = new Set(schedules.map(s => String((s.class_id as any)?._id || s.class_id))).size;
    const markedClassesToday = markedClassIds.size;

    // 4. Announcements
    const announcements = await AnnouncementModel.find(filter).sort({ createdAt: -1 }).limit(5).lean();

    return {
      teacher: {
        id: String(teacher._id),
        employee_no: (teacher as any).employee_no || "EMP-001",
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        qualification: (teacher as any).qualification || "N/A",
        status: teacher.status || "active"
      },
      school: {
        name: school?.name || "Eduplexo School",
        session: ay?.year || "2024-25"
      },
      alerts: [],
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
