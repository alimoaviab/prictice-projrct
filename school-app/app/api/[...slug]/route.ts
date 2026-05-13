import { getRequestContext, getQuery, handleApiResponse } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { ServiceResult } from "@edu/shared/types/core";
import * as academicYearService from "@edu/shared/services/academic-year.service";
import * as classService from "@edu/shared/services/class.service";
import * as studentService from "@edu/shared/services/student.service";
import * as teacherService from "@edu/shared/services/teacher.service";
import * as subjectService from "@edu/shared/services/subject.service";
import * as attendanceService from "@edu/shared/services/attendance.service";
import * as examService from "@edu/shared/services/exam.service";
import * as resultService from "@edu/shared/services/result.service";
import * as homeworkService from "@edu/shared/services/homework.service";
import * as eventService from "@edu/shared/services/event.service";
import * as announcementService from "@edu/shared/services/announcement.service";
import * as feeFlowService from "@edu/shared/services/fee-flow.service";
import * as parentService from "@edu/shared/services/parent.service";

function handleAuthUtilityRoutes(slug: string[], method: string) {
    if (slug[0] !== "auth") return null;

    // Ignore framework/session probe routes that can be called before login.
    if (slug[1] === "session" && method === "GET") {
        return NextResponse.json(null, { status: 200 });
    }

    if (slug[1] === "_log" && method === "POST") {
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json(
        { ok: false, success: false, message: "Auth route not found", error: { code: "NOT_FOUND", message: "Auth route not found" } },
        { status: 404 }
    );
}

async function executeServiceAction(path: string[], method: string, ctx: any, query: any, body: any): Promise<ServiceResult<any>> {
    const resource = path[0];
    const id = path[1];

    await connectDb();

    switch (resource) {
        case "academic-years":
            if (method === "GET") return id ? academicYearService.getAcademicYear(ctx, id) : academicYearService.listAcademicYears(ctx);
            if (method === "POST") return academicYearService.createAcademicYear(ctx, body);
            if (method === "PATCH" && id) return academicYearService.updateAcademicYear(ctx, id, body);
            break;

        case "classes":
            if (method === "GET") return id ? classService.getClass(ctx, id) : classService.listClasses(ctx, query);
            if (method === "POST") return classService.createClass(ctx, body);
            if (method === "PATCH" && id) return classService.updateClass(ctx, id, body);
            if (method === "DELETE" && id) return classService.deleteClass(ctx, id);
            break;

        case "students":
            if (method === "GET") return id ? studentService.getStudent(ctx, id) : studentService.listStudents(ctx, query);
            if (method === "POST") return studentService.createStudent(ctx, body);
            if (method === "PATCH" && id) return studentService.updateStudent(ctx, id, body);
            break;

        case "teachers":
            if (method === "GET") return id ? teacherService.getTeacher(ctx, id) : teacherService.listTeachers(ctx, query);
            if (method === "POST") return teacherService.createTeacher(ctx, body);
            if (method === "PATCH" && id) return teacherService.updateTeacher(ctx, id, body);
            break;

        case "subjects":
            if (method === "GET") return id ? subjectService.getSubject(ctx, id) : subjectService.listSubjects(ctx, query);
            if (method === "POST") return subjectService.createSubject(ctx, body);
            if (method === "PATCH" && id) return subjectService.updateSubject(ctx, id, body);
            break;

        case "attendance":
            if (method === "GET") return attendanceService.listAttendance(ctx, query);
            if (method === "POST") return attendanceService.markAttendanceBulk(ctx, body);
            break;

        case "exams":
            if (method === "GET") return id ? examService.getExam(ctx, id) : examService.listExams(ctx, query);
            if (method === "POST") return examService.createExam(ctx, body);
            break;

        case "results":
            if (method === "GET") return resultService.listResults(ctx, query);
            if (method === "POST") return resultService.saveExamResults(ctx, id, body);
            break;

        case "homework":
            if (method === "GET") return id ? homeworkService.getHomework(ctx, id) : homeworkService.listHomework(ctx, query);
            if (method === "POST") return homeworkService.createHomework(ctx, body);
            break;

        case "events":
            if (method === "GET") return id ? eventService.getEvent(ctx, id) : eventService.listEvents(ctx, query);
            if (method === "POST") return eventService.createEvent(ctx, body);
            break;

        case "announcements":
            if (method === "GET") return id ? announcementService.getAnnouncement(ctx, id) : announcementService.listAnnouncements(ctx, query);
            if (method === "POST") return announcementService.createAnnouncement(ctx, body);
            break;
            
        case "fees":
            if (method === "GET" && path.includes("ledger")) return feeFlowService.getFeeLedgerDashboard(ctx, query);
            break;

        case "parents":
            if (method === "POST" && id === "check-email") return parentService.checkParentEmail(ctx, body.email);
            if (method === "POST" && id === "link-child") return parentService.linkStudentToParent(ctx, body);
            if (method === "GET" && id === "children") return parentService.getParentChildren(ctx);
            break;
    }

    return {
        ok: false,
        success: false,
        message: `Method ${method} for ${resource} not implemented`,
        error: { code: "NOT_FOUND", message: `Method ${method} for ${resource} not implemented`, status: 404 }
    };
}

export async function GET(req: Request, context: any) {
    const params = await context.params;
    const slug = params?.slug || [];
    const authUtilityResponse = handleAuthUtilityRoutes(slug, "GET");
    if (authUtilityResponse) return authUtilityResponse;

    const ctx = getRequestContext(req);
    const query = getQuery(req);
    return handleApiResponse(await executeServiceAction(slug, "GET", ctx, query, null));
}

export async function POST(req: Request, context: any) {
    const params = await context.params;
    const slug = params?.slug || [];
    const authUtilityResponse = handleAuthUtilityRoutes(slug, "POST");
    if (authUtilityResponse) return authUtilityResponse;

    const ctx = getRequestContext(req);
    const body = await req.json().catch(() => ({}));
    return handleApiResponse(await executeServiceAction(slug, "POST", ctx, {}, body));
}

export async function PATCH(req: Request, context: any) {
    const params = await context.params;
    const slug = params?.slug || [];
    const authUtilityResponse = handleAuthUtilityRoutes(slug, "PATCH");
    if (authUtilityResponse) return authUtilityResponse;

    const ctx = getRequestContext(req);
    const body = await req.json().catch(() => ({}));
    return handleApiResponse(await executeServiceAction(slug, "PATCH", ctx, {}, body));
}

export async function DELETE(req: Request, context: any) {
    const params = await context.params;
    const slug = params?.slug || [];
    const authUtilityResponse = handleAuthUtilityRoutes(slug, "DELETE");
    if (authUtilityResponse) return authUtilityResponse;

    const ctx = getRequestContext(req);
    return handleApiResponse(await executeServiceAction(slug, "DELETE", ctx, {}, null));
}
