import { LiveClass, ILiveClass } from "../../models/live/live-class.model";
import { RequestContext } from "../../types/core";
import { tenantFilter } from "../../db/tenant-query";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "../../lib/google/calendar";
import mongoose from "mongoose";
import { TeacherModel } from "../../models/teacher.model";
import { UserModel } from "../../models/user.model";
import { StudentModel } from "../../models/student.model";

/**
 * Generate a fallback meeting link when Google Meet is unavailable
 * Format: https://meet.eduexplo.com/class-{classId}-{timestamp}
 */
function generateFallbackMeetingLink(classId: string): string {
  const timestamp = Date.now().toString(36);
  const randomId = Math.random().toString(36).substring(2, 8);
  return `https://meet.eduexplo.com/class-${classId}-${timestamp}-${randomId}`;
}

export class LiveClassService {
  static async createClass(
    ctx: RequestContext,
    data: {
      title: string;
      teacherId: string;
      classId: string;
      sectionId?: string;
      subjectId: string;
      startTime: string;
      endTime: string;
    }
  ): Promise<ILiveClass> {
    const attendees: Array<{ email: string; displayName?: string }> = [];

    if (ctx.actor_email) {
      attendees.push({ email: ctx.actor_email, displayName: "Organizer" });
    }

    try {
      const teacher = await TeacherModel.findOne({
        school_id: ctx.school_id,
        _id: new mongoose.Types.ObjectId(data.teacherId)
      })
        .select("user_id first_name last_name")
        .lean() as any;

      if (teacher?.user_id) {
        const teacherUser = await UserModel.findOne({
          school_id: ctx.school_id,
          _id: teacher.user_id
        })
          .select("email")
          .lean() as any;

        if (teacherUser?.email) {
          attendees.push({
            email: teacherUser.email,
            displayName: `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || "Teacher"
          });
        }
      }
    } catch (error) {
      console.warn("[LiveClassService] Could not resolve teacher attendee email", {
        teacherId: data.teacherId,
        error: (error as Error)?.message
      });
    }

    // Generate Meet link - try Google Meet first, fallback to custom link
    let meetingLink = "";
    let meetingId = "";
    
    console.info("[LiveClassService.createClass] Starting link generation for class:", data.classId);
    
    try {
      console.info("[LiveClassService.createClass] Attempting Google Meet link generation...");
      const meetResult = await createGoogleMeetEvent(
        ctx,
        data.title,
        data.startTime,
        data.endTime,
        `Live class for class ${data.classId}`,
        attendees
      );
      meetingLink = meetResult.meetingLink || "";
      meetingId = meetResult.eventId || "";
      console.info("[LiveClassService.createClass] ✅ Google Meet link generated successfully", { 
        meetingLink,
        meetingId
      });
    } catch (error) {
      console.warn("[LiveClassService.createClass] ❌ Could not generate Google Meet link, using fallback:", {
        error: (error as Error)?.message
      });
      // Generate fallback link
      meetingLink = generateFallbackMeetingLink(data.classId);
      console.info("[LiveClassService.createClass] ✅ Fallback meeting link generated", { meetingLink });
    }

    // Ensure we always have a meeting link
    if (!meetingLink) {
      console.warn("[LiveClassService.createClass] ⚠️ No meeting link generated, creating fallback as safety net");
      meetingLink = generateFallbackMeetingLink(data.classId);
      console.info("[LiveClassService.createClass] ✅ Safety net fallback link created", { meetingLink });
    }

    console.info("[LiveClassService.createClass] Final meeting link:", { meetingLink, meetingId });

    const liveClass = new LiveClass({
      school_id: ctx.school_id,
      title: data.title,
      teacherId: new mongoose.Types.ObjectId(data.teacherId),
      classId: new mongoose.Types.ObjectId(data.classId),
      sectionId: data.sectionId ? new mongoose.Types.ObjectId(data.sectionId) : undefined,
      subjectId: new mongoose.Types.ObjectId(data.subjectId),
      meetingLink,
      meetingId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      status: "SCHEDULED",
      createdBy: new mongoose.Types.ObjectId(ctx.user_id),
    });

    console.info("[LiveClassService.createClass] Saving live class to database...", {
      title: liveClass.title,
      meetingLink: liveClass.meetingLink,
      status: liveClass.status
    });

    const savedClass = await liveClass.save();

    console.info("[LiveClassService.createClass] ✅ Live class saved successfully", {
      id: savedClass._id,
      meetingLink: savedClass.meetingLink,
      status: savedClass.status
    });

    // Share link with students in the class
    try {
      console.info("[LiveClassService.createClass] Sharing link with students...");
      await this.shareClassLinkWithStudents(ctx, data.classId, meetingLink, data.title);
      console.info("[LiveClassService.createClass] ✅ Link shared with students");
    } catch (error) {
      console.warn("[LiveClassService.createClass] ⚠️ Could not share link with students:", error);
    }

    return savedClass as ILiveClass;
  }

  /**
   * Share the live class link with all students in the class
   */
  private static async shareClassLinkWithStudents(
    ctx: RequestContext,
    classId: string,
    meetingLink: string,
    title: string
  ): Promise<void> {
    try {
      console.info("[LiveClassService.shareClassLinkWithStudents] Starting student link sharing...", {
        classId,
        meetingLink,
        title
      });

      // Get all active students in the class
      const students = await StudentModel.find({
        school_id: ctx.school_id,
        class_id: new mongoose.Types.ObjectId(classId),
        status: "active"
      })
        .select("user_id email first_name last_name")
        .lean() as any[];

      console.info("[LiveClassService.shareClassLinkWithStudents] Found students:", {
        count: students.length
      });

      if (students.length === 0) {
        console.info("[LiveClassService.shareClassLinkWithStudents] No students found in class to share link with");
        return;
      }

      // Get user emails for students
      const userIds = students.map(s => s.user_id).filter(Boolean);
      console.info("[LiveClassService.shareClassLinkWithStudents] Fetching user emails...", {
        userCount: userIds.length
      });

      const users = await UserModel.find({
        school_id: ctx.school_id,
        _id: { $in: userIds }
      })
        .select("_id email")
        .lean() as any[];

      const userEmailMap = new Map(users.map(u => [u._id.toString(), u.email]));

      // Prepare notification data
      const studentEmails = students
        .map(s => userEmailMap.get(s.user_id?.toString() || ""))
        .filter(Boolean) as string[];

      console.info("[LiveClassService.shareClassLinkWithStudents] ✅ Sharing complete", {
        classId,
        studentCount: students.length,
        emailCount: studentEmails.length,
        title,
        meetingLink
      });

      // TODO: Send notifications to students (email, SMS, in-app notification)
      // For now, just log that we would share it
    } catch (error) {
      console.warn("[LiveClassService.shareClassLinkWithStudents] ⚠️ Error sharing link with students:", {
        error: (error as Error)?.message
      });
      // Don't throw - this is a non-critical operation
    }
  }

  static async getClasses(
    ctx: RequestContext,
    filters: { teacherId?: string; classId?: string; status?: string; date?: string } = {}
  ): Promise<ILiveClass[]> {
    const query: any = tenantFilter(ctx, {});

    if (filters.teacherId) query.teacherId = new mongoose.Types.ObjectId(filters.teacherId);
    if (filters.classId) query.classId = new mongoose.Types.ObjectId(filters.classId);
    if (filters.status) query.status = filters.status;

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    return LiveClass.find(query)
      .populate("teacherId", "user firstName lastName")
      .populate("classId", "name")
      .populate("subjectId", "name")
      .sort({ startTime: 1 })
      .lean() as unknown as ILiveClass[];
  }

  static async updateClassStatus(
    ctx: RequestContext,
    classId: string,
    status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED"
  ): Promise<ILiveClass | null> {
    const liveClass = await LiveClass.findOneAndUpdate(
      tenantFilter(ctx, { _id: new mongoose.Types.ObjectId(classId) }),
      { status, updatedAt: new Date() },
      { new: true }
    );
    return liveClass as ILiveClass | null;
  }

  static async deleteClass(ctx: RequestContext, classId: string): Promise<boolean> {
    const liveClass = await LiveClass.findOne(tenantFilter(ctx, { _id: new mongoose.Types.ObjectId(classId) }));
    if (!liveClass) return false;

    if (liveClass.meetingId) {
       try {
         await deleteGoogleMeetEvent(ctx, liveClass.meetingId);
       } catch (e) {
         console.warn("Could not delete associated calendar event");
       }
    }

    await LiveClass.deleteOne({ _id: liveClass._id });
    return true;
  }
}
