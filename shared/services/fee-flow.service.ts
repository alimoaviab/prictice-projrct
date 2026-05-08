// @ts-nocheck
import { randomBytes, createHash } from "node:crypto";
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import {
    AcademicYearModel,
    ClassFeeModel,
    ClassModel,
    FeeAdjustmentModel,
    FeeModel,
    FeePaymentModel,
    FeeTypeModel,
    ParentModel,
    StudentModel,
} from "../models";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import {
    classFeeAddSchema,
    classFeeItemSchema,
    classFeeSetSchema,
    feeAdjustmentCreateSchema,
    feeAnalyticsFilterSchema,
    feeFilterSchema,
    feePaymentBulkSchema,
    feePaymentRecordSchema,
    feeTypeCreateSchema,
    monthlyFeeDuplicateSchema,
    monthlyFeeGenerateSchema,
} from "../validation/fee.schema";
import { resolveClassIdsForAcademyCare } from "./_academy-care-filter";
import { writeAuditLog } from "./audit.service";

type FeeTypeDoc = {
    _id: unknown;
    school_id: string;
    name: string;
    description?: string;
    is_recurring: boolean;
    category?: string;
    status?: string;
    created_at?: Date;
    updated_at?: Date;
};

type ClassFeeDoc = {
    _id: unknown;
    class_id: unknown;
    academic_year_id: unknown;
    fee_type_id: unknown;
    amount: number;
    due_date: Date;
    is_monthly: boolean;
    notes?: string;
    status?: string;
};

type AdjustmentDoc = {
    _id: unknown;
    student_id: unknown;
    academic_year_id: unknown;
    type: "discount" | "waiver" | "penalty" | "scholarship";
    amount: number;
    reason: string;
    valid_from: Date;
    valid_until: Date;
    status?: string;
};

type MonthlyFeeDoc = {
    _id: unknown;
    student_id: unknown;
    class_id: unknown;
    academic_year_id: unknown;
    invoice_no: string;
    title: string;
    amount: number;
    due_at: Date;
    month?: string;
    year?: number;
    paid_amount?: number;
    adjustment_amount?: number;
    status?: string;
    fee_components?: Array<{
        fee_type_id?: unknown;
        fee_type?: string;
        amount?: number;
        paid_amount?: number;
    }>;
    payments?: Array<{
        amount?: number;
        paid_at?: Date;
        method?: string;
        reference?: string;
        received_by?: unknown;
    }>;
};

type AllocatePaymentInput = {
    studentId: string;
    amount: number;
    paymentMethod: string;
    referenceNo: string;
    notes: string;
    paymentDate: Date;
};

type FeePaymentDoc = {
    _id: unknown;
    receipt_no: string;
    student_id: unknown;
    class_id?: unknown;
    academic_year_id?: unknown;
    amount: number;
    payment_date: Date;
    payment_method: string;
    reference_no?: string;
    notes?: string;
    status?: string;
    allocations?: Array<{
        fee_id?: unknown;
        fee_type_id?: unknown;
        month?: string;
        amount?: number;
    }>;
};

type ParentFeeChild = {
    student_id: string;
    student_name: string;
    class_name: string;
    fee_summary: {
        total_fee: number;
        paid: number;
        pending: number;
        percentage_paid: number;
        status: "unpaid" | "partial" | "paid";
    };
    monthly_fees: Array<{
        id: string;
        month: string;
        total: number;
        paid: number;
        pending: number;
        status: string;
        due_date: string;
    }>;
    due_notices: Array<{
        month: string;
        pending: number;
        due_date: string;
        days_overdue: number;
    }>;
};

function toId(value: unknown): string {
    return String((value as { _id?: unknown })?._id ?? value ?? "");
}

function titleCase(value: string): string {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function monthToNumber(month: string): number {
    const lookup: Record<string, number> = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
    };

    const key = month.trim().toLowerCase();
    if (key in lookup) {
        return lookup[key];
    }

    const parsed = Number(month);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 12) {
        return parsed - 1;
    }

    throw new ControlledError("VALIDATION_ERROR", "Invalid month.", 400);
}

function monthYearLabel(month: string, year: number): string {
    return `${titleCase(month)} ${year}`;
}

function monthBounds(month: string, year: number) {
    const monthIndex = monthToNumber(month);
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end, monthIndex };
}

function monthKeyFromDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromDate(date: Date) {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function normalizePaymentMethod(method: string) {
    return method.trim().toLowerCase();
}

function makeInvoiceNo(studentId: string, month: string, year: number) {
    const hash = createHash("sha1").update(`${studentId}:${month}:${year}:${Date.now()}:${randomBytes(6).toString("hex")}`).digest("hex").slice(0, 10).toUpperCase();
    return `INV-${year}${String(monthToNumber(month) + 1).padStart(2, "0")}-${hash}`;
}

function makeReceiptNo() {
    return `RCP-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function feeStatus(total: number, paid: number) {
    if (paid <= 0) return "unpaid";
    if (paid >= total) return "paid";
    return "partial";
}

function effectiveAdjustmentAmount(type: AdjustmentDoc["type"], amount: number) {
    if (type === "penalty") return amount;
    return -Math.abs(amount);
}

async function resolveAcademicYearId(ctx: RequestContext, academicYearId?: string) {
    if (academicYearId) return academicYearId;
    const active = (await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true })).select("_id year").lean()) as any;
    return active?._id ? String(active._id) : undefined;
}

async function resolveParentStudentIds(ctx: RequestContext): Promise<string[]> {
    if (ctx.role !== "parent") {
        return [];
    }

    const links = await ParentModel.find(tenantFilter(ctx, { user_id: ctx.user_id, status: "active" })).select("student_id").lean();
    return links.map((row) => String(row.student_id));
}

async function loadStudentForContext(ctx: RequestContext, studentId?: string) {
    if (studentId) {
        const student = await StudentModel.findOne(tenantFilter(ctx, { _id: studentId }))
            .populate("class_id", "name section academic_year grade_thresholds academy_care_id")
            .lean();
        if (!student) throw new ControlledError("NOT_FOUND", "Student not found.", 404);
        return student as any;
    }

    const parentStudentIds = await resolveParentStudentIds(ctx);
    if (parentStudentIds.length > 0) {
        const student = await StudentModel.findOne(tenantFilter(ctx, { _id: { $in: parentStudentIds } }))
            .populate("class_id", "name section academic_year grade_thresholds academy_care_id")
            .lean();
        if (!student) throw new ControlledError("NOT_FOUND", "Student not found.", 404);
        return student as any;
    }

    const student = await StudentModel.findOne(tenantFilter(ctx, { user_id: ctx.user_id }))
        .populate("class_id", "name section academic_year grade_thresholds academy_care_id")
        .lean();
    if (!student) throw new ControlledError("NOT_FOUND", "Student not found.", 404);
    return student as any;
}

async function loadClassFees(ctx: RequestContext, classId: string, academicYearId: string) {
    return ClassFeeModel.find(
        tenantFilter(ctx, {
            class_id: classId,
            academic_year_id: academicYearId,
            status: "active"
        })
    )
        .populate("fee_type_id", "name description is_recurring category status")
        .sort({ due_date: 1 })
        .lean();
}

async function loadActiveAdjustments(ctx: RequestContext, studentId: string, academicYearId: string, referenceDate?: Date) {
    const now = referenceDate ?? new Date();
    const rows = await FeeAdjustmentModel.find(
        tenantFilter(ctx, {
            student_id: studentId,
            academic_year_id: academicYearId
        })
    )
        .lean();

    return rows.filter((row: any) => {
        const from = new Date(String(row.valid_from));
        const until = new Date(String(row.valid_until));
        return from <= now && until >= now && (row.status ?? "active") === "active";
    }) as AdjustmentDoc[];
}

async function studentAdjustmentsForDate(ctx: RequestContext, studentId: string, academicYearId: string, dueDate: Date) {
    const adjustments = await loadActiveAdjustments(ctx, studentId, academicYearId, dueDate);
    return adjustments.reduce((sum, adjustment) => sum + effectiveAdjustmentAmount(adjustment.type, Number(adjustment.amount ?? 0)), 0);
}

async function currentFeeOutstanding(ctx: RequestContext, fee: MonthlyFeeDoc) {
    const adjustment = Number(fee.adjustment_amount ?? 0);
    const total = Number(fee.amount ?? 0) + adjustment;
    const paid = Number(fee.paid_amount ?? 0);
    return Math.max(0, total - paid);
}

function mapFeeType(row: any) {
    return {
        id: String(row._id),
        _id: String(row._id),
        name: row.name,
        description: row.description ?? "",
        is_recurring: Boolean(row.is_recurring),
        category: row.category ?? "academic",
        status: row.status ?? "active",
        created_at: row.created_at?.toISOString?.() ?? row.created_at,
        updated_at: row.updated_at?.toISOString?.() ?? row.updated_at,
    };
}

function mapFeeConfig(row: ClassFeeDoc, feeTypeName = "") {
    return {
        id: String(row._id),
        fee_type_id: String(row.fee_type_id),
        fee_type: feeTypeName,
        amount: Number(row.amount ?? 0),
        due_date: row.due_date instanceof Date ? row.due_date.toISOString().split("T")[0] : String(row.due_date ?? ""),
        is_monthly: Boolean(row.is_monthly),
        notes: row.notes ?? "",
    };
}

function mapFeeRecord(row: MonthlyFeeDoc, student?: any, classroom?: any) {
    const total = Number(row.amount ?? 0) + Number(row.adjustment_amount ?? 0);
    const paid = Number(row.paid_amount ?? 0);
    return {
        id: String(row._id),
        student_id: String(row.student_id),
        student_name: student ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() : "",
        class: classroom?.name ?? "",
        month: row.month ? `${row.month} ${row.year ?? ""}`.trim() : monthLabelFromDate(new Date(String(row.due_at))),
        total_fee: total,
        paid,
        pending: Math.max(0, total - paid),
        status: feeStatus(total, paid),
        fee_components: (row.fee_components ?? []).map((component) => ({
            type: component.fee_type ?? "",
            amount: Number(component.amount ?? 0),
            paid: Number(component.paid_amount ?? 0),
        })),
        due_date: row.due_at instanceof Date ? row.due_at.toISOString().split("T")[0] : String(row.due_at ?? ""),
    };
}

function monthlyFeeSummary(rows: MonthlyFeeDoc[]) {
    const summary = rows.reduce(
        (acc, row) => {
            const total = Number(row.amount ?? 0) + Number(row.adjustment_amount ?? 0);
            const paid = Number(row.paid_amount ?? 0);
            acc.total_fees += 1;
            acc.collected += Math.min(total, paid);
            acc.pending += Math.max(0, total - paid);
            return acc;
        },
        { total_fees: 0, collected: 0, pending: 0, collection_percentage: 0 }
    );

    summary.collection_percentage = summary.total_fees > 0 ? Number(((summary.collected / (summary.collected + summary.pending || 1)) * 100).toFixed(1)) : 0;
    return summary;
}

export async function listFeeTypes(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const rows = await FeeTypeModel.find(tenantFilter(ctx)).sort({ created_at: -1 }).lean();
        return rows.map(mapFeeType);
    });
}

export async function createFeeType(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = feeTypeCreateSchema.parse(input);
        const saved = await FeeTypeModel.findOneAndUpdate(
            tenantFilter(ctx, { name: parsed.name }),
            {
                $set: {
                    name: parsed.name,
                    description: parsed.description ?? "",
                    is_recurring: parsed.is_recurring,
                    category: parsed.category,
                    status: "active",
                },
                $setOnInsert: { school_id: ctx.school_id }
            },
            { new: true, upsert: true, runValidators: true }
        ).lean();

        await writeAuditLog(ctx, {
            action: "create",
            entity_type: "fee",
            entity_id: String(saved?._id),
            after: saved,
            metadata: { scope: "fee_type" }
        });

        return mapFeeType(saved as FeeTypeDoc);
    });
}

export async function setClassFees(ctx: RequestContext, classId: string, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = classFeeSetSchema.parse(input);
        const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: classId, academy_care_id: parsed.academic_year_id })).populate("academy_care_id", "year").lean();
        if (!classroom) throw new ControlledError("NOT_FOUND", "Class not found.", 404);

        await ClassFeeModel.deleteMany(tenantFilter(ctx, { class_id: classId, academic_year_id: parsed.academic_year_id }));

        const feeTypeIds = parsed.fees.map((fee) => fee.fee_type_id);
        const feeTypes = await FeeTypeModel.find(tenantFilter(ctx, { _id: { $in: feeTypeIds } })).select("name").lean();
        const feeTypeMap = new Map(feeTypes.map((feeType: any) => [String(feeType._id), feeType.name]));

        const created = await ClassFeeModel.insertMany(
            parsed.fees.map((fee) => ({
                school_id: ctx.school_id,
                class_id: new Types.ObjectId(classId),
                academic_year_id: new Types.ObjectId(parsed.academic_year_id),
                fee_type_id: new Types.ObjectId(fee.fee_type_id),
                amount: fee.amount,
                due_date: fee.due_date,
                is_monthly: fee.is_monthly,
                notes: fee.notes ?? "",
                status: "active",
            }))
        );

        const totalAnnualFee = created.reduce((sum, fee) => sum + Number(fee.amount ?? 0) * (fee.is_monthly ? 12 : 1), 0);

        await ClassModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: classId }),
            { $set: { fee_structure: { total_annual: totalAnnualFee, monthly_recurring: created.filter((item) => item.is_monthly).reduce((sum, item) => sum + Number(item.amount ?? 0), 0), fees_configured: true } } },
            { new: true }
        );

        return {
            class_id: classId,
            class_name: classroom.name,
            academic_year: (classroom as any).academy_care_id?.year ?? parsed.academic_year_id,
            fees_set: created.length,
            total_annual_fee: totalAnnualFee,
            fees: created.map((fee) => mapFeeConfig(fee as any, feeTypeMap.get(String((fee as any).fee_type_id)) ?? ""))
        };
    });
}

export async function getClassFees(ctx: RequestContext, classId: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: classId }))
            .populate("academy_care_id", "year")
            .lean();
        if (!classroom) throw new ControlledError("NOT_FOUND", "Class not found.", 404);

        const configs = await ClassFeeModel.find(tenantFilter(ctx, { class_id: classId, academic_year_id: (classroom as any).academy_care_id?._id ?? (classroom as any).academy_care_id }))
            .populate("fee_type_id", "name")
            .sort({ due_date: 1 })
            .lean();

        const mapped = configs.map((config: any) => mapFeeConfig(config, config.fee_type_id?.name ?? ""));
        const totalAnnual = mapped.reduce((sum, fee) => sum + Number(fee.amount ?? 0) * (fee.is_monthly ? 12 : 1), 0);
        const monthlyRecurring = mapped.filter((fee) => fee.is_monthly).reduce((sum, fee) => sum + Number(fee.amount ?? 0), 0);
        const oneTimeFees = mapped.filter((fee) => !fee.is_monthly).reduce((sum, fee) => sum + Number(fee.amount ?? 0), 0);

        return {
            class_id: classId,
            class_name: classroom.name,
            academic_year: (classroom as any).academy_care_id?.year ?? "",
            total_annual: totalAnnual,
            monthly_recurring: monthlyRecurring,
            one_time_fees: oneTimeFees,
            fees: mapped.map((fee) => ({
                ...fee,
                total_for_year: fee.is_monthly ? Number(fee.amount ?? 0) * 12 : Number(fee.amount ?? 0)
            }))
        };
    });
}

export async function addClassFee(ctx: RequestContext, classId: string, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = classFeeAddSchema.parse(input);
        const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: classId })).lean();
        if (!classroom) throw new ControlledError("NOT_FOUND", "Class not found.", 404);

        const saved = await ClassFeeModel.findOneAndUpdate(
            tenantFilter(ctx, {
                class_id: classId,
                academic_year_id: (classroom as any).academy_care_id,
                fee_type_id: parsed.fee_type_id,
            }),
            {
                $set: {
                    class_id: new Types.ObjectId(classId),
                    academic_year_id: new Types.ObjectId(String((classroom as any).academy_care_id)),
                    fee_type_id: new Types.ObjectId(parsed.fee_type_id),
                    amount: parsed.amount,
                    due_date: parsed.due_date,
                    is_monthly: parsed.is_monthly,
                    notes: parsed.notes ?? "",
                    status: "active",
                    school_id: ctx.school_id,
                },
            },
            { new: true, upsert: true, runValidators: true }
        ).populate("fee_type_id", "name").lean();

        return mapFeeConfig(saved as any, (saved as any)?.fee_type_id?.name ?? "");
    });
}

export async function updateClassFee(ctx: RequestContext, classId: string, feeId: string, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "update");

        const patch: Record<string, unknown> = {};
        const body = input as Record<string, unknown>;
        if (body.amount !== undefined) patch.amount = Number(body.amount);
        if (body.due_date !== undefined) patch.due_date = new Date(String(body.due_date));
        if (body.is_monthly !== undefined) patch.is_monthly = Boolean(body.is_monthly);
        if (body.notes !== undefined) patch.notes = String(body.notes);

        const updated = await ClassFeeModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: feeId, class_id: classId }),
            { $set: patch },
            { new: true, runValidators: true }
        ).populate("fee_type_id", "name").lean();

        if (!updated) throw new ControlledError("NOT_FOUND", "Class fee not found.", 404);
        return mapFeeConfig(updated as any, (updated as any).fee_type_id?.name ?? "");
    });
}

export async function deleteClassFee(ctx: RequestContext, classId: string, feeId: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "delete");

        const deleted = await ClassFeeModel.findOneAndDelete(tenantFilter(ctx, { _id: feeId, class_id: classId }));
        if (!deleted) throw new ControlledError("NOT_FOUND", "Class fee not found.", 404);
        return { success: true };
    });
}

export async function checkFeeDuplicates(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = monthlyFeeDuplicateSchema.parse(input);
        const academicYearId = await resolveAcademicYearId(ctx, parsed.academic_year_id);
        if (!academicYearId) throw new ControlledError("NOT_FOUND", "Academic year not found.", 404);

        const { start, end } = monthBounds(parsed.month, parsed.year);
        const classes = await resolveClassIdsForAcademyCare(ctx, academicYearId);
        const total = await FeeModel.countDocuments(
            tenantFilter(ctx, {
                academic_year_id: academicYearId,
                class_id: { $in: classes },
                due_at: { $gte: start, $lte: end }
            })
        );

        return {
            has_duplicates: total > 0,
            duplicate_count: total,
            safe_to_generate: total === 0,
        };
    });
}

export async function generateMonthlyFees(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = monthlyFeeGenerateSchema.parse(input);
        const academicYearId = await resolveAcademicYearId(ctx, parsed.academic_year_id);
        if (!academicYearId) throw new ControlledError("NOT_FOUND", "Academic year not found.", 404);

        const { start, end } = monthBounds(parsed.month, parsed.year);
        const classIds = await resolveClassIdsForAcademyCare(ctx, academicYearId);
        const classes = await ClassModel.find(tenantFilter(ctx, { _id: { $in: classIds } }))
            .populate("academy_care_id", "year")
            .lean();

        const students = await StudentModel.find(
            tenantFilter(ctx, { class_id: { $in: classIds }, status: "active" })
        )
            .populate("class_id", "name section academy_care_id")
            .lean();

        let classesProcessed = 0;
        let studentsProcessed = 0;
        let feesGenerated = 0;
        let feesSkipped = 0;
        let totalAmountGenerated = 0;

        const classMap = new Map(classes.map((classRow: any) => [String(classRow._id), classRow]));
        const studentsByClass = new Map<string, any[]>();
        for (const student of students as any[]) {
            const classId = String(student.class_id?._id ?? student.class_id);
            if (!studentsByClass.has(classId)) studentsByClass.set(classId, []);
            studentsByClass.get(classId)!.push(student);
        }

        for (const classId of classIds) {
            const classroom = classMap.get(String(classId));
            if (!classroom) continue;
            classesProcessed += 1;

            const classFees = await loadClassFees(ctx, String(classId), academicYearId);
            const applicableFees = classFees.filter((fee: any) => fee.is_monthly || (new Date(fee.due_date).getMonth() === start.getMonth() && new Date(fee.due_date).getFullYear() === parsed.year));
            if (applicableFees.length === 0) continue;

            const classStudents = studentsByClass.get(String(classId)) || [];
            for (const student of classStudents) {
                studentsProcessed += 1;

                const existing = await FeeModel.findOne(
                    tenantFilter(ctx, {
                        student_id: student._id,
                        academic_year_id: academicYearId,
                        month: parsed.month.toLowerCase(),
                        year: parsed.year,
                    })
                ).lean();

                if (existing && !parsed.force_regenerate) {
                    feesSkipped += 1;
                    continue;
                }

                if (existing && parsed.force_regenerate && Number(existing.paid_amount ?? 0) > 0) {
                    throw new ControlledError("CONFLICT", "Cannot regenerate fees that already have payments.", 409);
                }

                const adjustmentAmount = await studentAdjustmentsForDate(ctx, String(student._id), academicYearId, end);
                const feeComponents = applicableFees.map((fee: any) => ({
                    fee_type_id: fee.fee_type_id,
                    fee_type: fee.fee_type_id?.name ?? "",
                    amount: Number(fee.amount ?? 0),
                    paid_amount: 0,
                }));

                const baseAmount = feeComponents.reduce((sum, component) => sum + Number(component.amount ?? 0), 0);
                const invoiceAmount = Math.max(0, baseAmount + adjustmentAmount);

                if (existing) {
                    await FeeModel.findOneAndUpdate(
                        tenantFilter(ctx, { _id: existing._id }),
                        {
                            $set: {
                                class_id: student.class_id,
                                academic_year_id: academicYearId,
                                fee_type_id: applicableFees[0]?.fee_type_id ?? undefined,
                                title: `Fees for ${monthYearLabel(parsed.month, parsed.year)}`,
                                amount: invoiceAmount,
                                due_at: end,
                                month: parsed.month.toLowerCase(),
                                year: parsed.year,
                                status: feeStatus(invoiceAmount, Number(existing.paid_amount ?? 0)),
                                fee_components: feeComponents,
                                adjustment_amount: adjustmentAmount,
                            }
                        },
                        { new: true }
                    );
                    feesGenerated += 1;
                    totalAmountGenerated += invoiceAmount;
                    continue;
                }

                const invoiceNo = makeInvoiceNo(String(student._id), parsed.month, parsed.year);
                await FeeModel.create({
                    school_id: ctx.school_id,
                    student_id: student._id,
                    class_id: student.class_id,
                    academic_year_id: academicYearId,
                    fee_type_id: applicableFees[0]?.fee_type_id ?? undefined,
                    invoice_no: invoiceNo,
                    title: `Fees for ${monthYearLabel(parsed.month, parsed.year)}`,
                    amount: invoiceAmount,
                    currency: "USD",
                    due_at: end,
                    status: "unpaid",
                    paid_amount: 0,
                    month: parsed.month.toLowerCase(),
                    year: parsed.year,
                    generated_at: new Date(),
                    generated_by: new Types.ObjectId(ctx.user_id),
                    fee_components: feeComponents,
                    payments: [],
                    adjustment_amount: adjustmentAmount,
                });

                feesGenerated += 1;
                totalAmountGenerated += invoiceAmount;
            }
        }

        await writeAuditLog(ctx, {
            action: "create",
            entity_type: "fee",
            entity_id: academicYearId,
            metadata: {
                scope: "monthly_generation",
                academic_year_id: academicYearId,
                month: parsed.month,
                year: parsed.year,
                classes_processed: classesProcessed,
                students_processed: studentsProcessed,
                fees_generated: feesGenerated,
                fees_skipped: feesSkipped,
            }
        });

        return {
            month: monthYearLabel(parsed.month, parsed.year),
            classes_processed: classesProcessed,
            students_processed: studentsProcessed,
            fees_generated: feesGenerated,
            fees_skipped: feesSkipped,
            total_amount_generated: totalAmountGenerated,
            status: "completed",
            timestamp: new Date().toISOString(),
        };
    });
}

export async function listMonthlyFees(ctx: RequestContext, filters: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const parsed = feeFilterSchema.parse(filters ?? {});
        const query: Record<string, unknown> = tenantFilter(ctx);
        if (parsed.class_id) query.class_id = parsed.class_id;
        if (parsed.month) query.month = parsed.month.toLowerCase();
        if (parsed.year) query.year = parsed.year;
        if (parsed.status) query.status = parsed.status;

        const [total, rows] = await Promise.all([
            FeeModel.countDocuments(query),
            FeeModel.find(query)
                .populate("student_id", "first_name last_name admission_no class_id")
                .populate("class_id", "name section")
                .populate("fee_type_id", "name")
                .sort({ due_at: -1, created_at: -1 })
                .skip((parsed.page - 1) * parsed.limit)
                .limit(parsed.limit)
                .lean(),
        ]);

        const list = rows as any[];
        const summary = monthlyFeeSummary(list as MonthlyFeeDoc[]);
        const pages = Math.max(1, Math.ceil(total / parsed.limit));

        return {
            filters: {
                class_id: parsed.class_id ?? null,
                month: parsed.month ?? null,
                year: parsed.year ?? null,
                status: parsed.status ?? "all",
            },
            summary,
            fees: list.map((row) => mapFeeRecord(row, row.student_id, row.class_id)),
            pagination: {
                page: parsed.page,
                limit: parsed.limit,
                total,
                pages,
            }
        };
    });
}

export async function createFeeAdjustment(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = feeAdjustmentCreateSchema.parse(input);
        const saved = await FeeAdjustmentModel.create({
            school_id: ctx.school_id,
            student_id: new Types.ObjectId(parsed.student_id),
            academic_year_id: new Types.ObjectId(parsed.academic_year_id),
            type: parsed.type,
            amount: parsed.amount,
            reason: parsed.reason,
            valid_from: parsed.valid_from,
            valid_until: parsed.valid_until,
            status: "active",
            applied_by: new Types.ObjectId(ctx.user_id)
        });

        await writeAuditLog(ctx, {
            action: "create",
            entity_type: "fee",
            entity_id: String(saved._id),
            after: saved,
            metadata: { scope: "adjustment" }
        });

        return {
            id: String(saved._id),
            student_id: String(saved.student_id),
            type: saved.type,
            amount: Number(saved.amount ?? 0),
            reason: saved.reason,
            applied_from: saved.valid_from.toISOString().split("T")[0],
            applied_until: saved.valid_until.toISOString().split("T")[0],
            status: saved.status
        };
    });
}

export async function listFeeAdjustments(ctx: RequestContext, filters: Record<string, unknown> = {}): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const query: Record<string, unknown> = tenantFilter(ctx);
        if (filters.student_id) query.student_id = String(filters.student_id);
        if (filters.type) query.type = String(filters.type);
        if (filters.status) query.status = String(filters.status);

        const rows = await FeeAdjustmentModel.find(query)
            .populate("student_id", "first_name last_name admission_no")
            .sort({ valid_from: -1, created_at: -1 })
            .lean();

        return {
            adjustments: rows.map((row: any) => ({
                id: String(row._id),
                student_name: `${row.student_id?.first_name ?? ""} ${row.student_id?.last_name ?? ""}`.trim(),
                type: row.type,
                amount: Number(row.amount ?? 0),
                reason: row.reason,
                valid_from: row.valid_from instanceof Date ? row.valid_from.toISOString().split("T")[0] : String(row.valid_from),
                valid_until: row.valid_until instanceof Date ? row.valid_until.toISOString().split("T")[0] : String(row.valid_until),
                status: row.status ?? "active"
            }))
        };
    });
}

export async function updateFeeAdjustment(ctx: RequestContext, adjustmentId: string, input: Record<string, unknown>): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "update");

        const patch: Record<string, unknown> = {};
        if (input.amount !== undefined) patch.amount = Number(input.amount);
        if (input.reason !== undefined) patch.reason = String(input.reason);
        if (input.valid_from !== undefined) patch.valid_from = new Date(String(input.valid_from));
        if (input.valid_until !== undefined) patch.valid_until = new Date(String(input.valid_until));
        if (input.status !== undefined) patch.status = String(input.status);

        const updated = await FeeAdjustmentModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: adjustmentId }),
            { $set: patch },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) throw new ControlledError("NOT_FOUND", "Adjustment not found.", 404);
        return { success: true, id: String((updated as any)._id) };
    });
}

export async function deleteFeeAdjustment(ctx: RequestContext, adjustmentId: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "delete");

        const deleted = await FeeAdjustmentModel.findOneAndDelete(tenantFilter(ctx, { _id: adjustmentId }));
        if (!deleted) throw new ControlledError("NOT_FOUND", "Adjustment not found.", 404);
        return { success: true };
    });
}

export async function getFeeBreakdown(ctx: RequestContext, filters: Record<string, unknown> = {}): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const student = await loadStudentForContext(ctx, String(filters.student_id ?? ""));
        const studentId = String(student._id);
        const classId = String(student.class_id?._id ?? student.class_id);
        const academicYearId = String(student.class_id?.academy_care_id?._id ?? student.class_id?.academy_care_id ?? student.class_id?.academy_care_id ?? "");
        const academicYear = academicYearId ? await AcademicYearModel.findOne(tenantFilter(ctx, { _id: academicYearId })).lean() : null;
        const fees = (await FeeModel.find(tenantFilter(ctx, { student_id: studentId }))
            .sort({ due_at: 1 })
            .lean()) as MonthlyFeeDoc[];
        const adjustments = academicYearId ? await FeeAdjustmentModel.find(tenantFilter(ctx, { student_id: studentId, academic_year_id: academicYearId }))
            .sort({ valid_from: 1 })
            .lean() as AdjustmentDoc[] : [];

        const monthWise = fees.map((fee) => {
            const month = fee.month ? titleCase(fee.month) : monthLabelFromDate(new Date(String(fee.due_at)));
            const adjustmentsForFee = adjustments.filter((adjustment) => new Date(adjustment.valid_from) <= new Date(String(fee.due_at)) && new Date(adjustment.valid_until) >= new Date(String(fee.due_at)));
            const discount = adjustmentsForFee.reduce((sum, adjustment) => sum + effectiveAdjustmentAmount(adjustment.type, Number(adjustment.amount ?? 0)), 0);
            const base = Number(fee.amount ?? 0);
            const final = Math.max(0, base + discount);
            return {
                month,
                base,
                discount,
                final
            };
        });

        const baseFees = fees.reduce((sum, fee) => sum + Number(fee.amount ?? 0), 0);
        const adjustmentsTotal = monthWise.reduce((sum, row) => sum + Number(row.discount ?? 0), 0);
        const finalFees = Math.max(0, baseFees + adjustmentsTotal);
        const paid = fees.reduce((sum, fee) => sum + Number(fee.paid_amount ?? 0), 0);

        return {
            student_id: studentId,
            student_name: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim(),
            class: student.class_id?.name ?? "",
            academic_year: academicYear?.year ?? "",
            fee_summary: {
                base_fees: baseFees,
                adjustments: adjustmentsTotal,
                final_fees: finalFees,
                paid,
                pending: Math.max(0, finalFees - paid)
            },
            month_wise: monthWise,
            active_adjustments: adjustments.map((adjustment) => ({
                type: adjustment.type,
                amount: Number(adjustment.amount ?? 0),
                reason: adjustment.reason,
                monthly_impact: effectiveAdjustmentAmount(adjustment.type, Number(adjustment.amount ?? 0))
            }))
        };
    });
}

async function allocatePayment(ctx: RequestContext, input: AllocatePaymentInput) {
    const { studentId, amount, paymentMethod, referenceNo, notes, paymentDate } = input;

    const student = await StudentModel.findOne(tenantFilter(ctx, { _id: studentId }))
        .populate("class_id", "name section academy_care_id")
        .lean();
    if (!student) throw new ControlledError("NOT_FOUND", "Student not found.", 404);

    const academicYearId = String((student as any).class_id?.academy_care_id?._id ?? (student as any).class_id?.academy_care_id ?? "");
    const fees = (await FeeModel.find(tenantFilter(ctx, {
        student_id: studentId,
        academic_year_id: academicYearId || undefined,
        status: { $in: ["unpaid", "partial"] }
    }))
        .sort({ due_at: 1 })
        .lean()) as MonthlyFeeDoc[];

    const outstanding = await Promise.all(fees.map((fee) => currentFeeOutstanding(ctx, fee)));
    const totalOutstanding = outstanding.reduce((sum, value) => sum + value, 0);
    if (amount > totalOutstanding) {
        throw new ControlledError("INVALID_AMOUNT", "Payment amount exceeds outstanding balance.", 400, { outstanding: totalOutstanding });
    }

    let remaining = amount;
    const allocations: Array<{ fee_id: unknown; fee_type_id?: unknown; month?: string; amount: number }> = [];

    for (let index = 0; index < fees.length && remaining > 0; index += 1) {
        const fee = fees[index];
        const currentOutstanding = outstanding[index];
        if (currentOutstanding <= 0) continue;

        const allocated = Math.min(remaining, currentOutstanding);
        remaining -= allocated;

        const totalAfterAdjustment = Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0);
        const paidBefore = Number(fee.paid_amount ?? 0);
        const paidAfter = paidBefore + allocated;
        const newStatus = feeStatus(totalAfterAdjustment, paidAfter);

        const updated = await FeeModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: fee._id }),
            {
                $set: { paid_amount: paidAfter, status: newStatus },
                $push: {
                    payments: {
                        amount: allocated,
                        paid_at: paymentDate,
                        method: paymentMethod,
                        reference: referenceNo,
                        received_by: new Types.ObjectId(ctx.user_id),
                    }
                }
            },
            { new: true }
        ).lean();

        allocations.push({
            fee_id: fee._id,
            fee_type_id: fee.fee_type_id,
            month: fee.month,
            amount: allocated,
        });

        if (!updated) {
            throw new ControlledError("PAYMENT_FAILED", "Failed to allocate payment.", 500);
        }
    }

    const paymentDoc = await FeePaymentModel.create({
        school_id: ctx.school_id,
        receipt_no: makeReceiptNo(),
        student_id: new Types.ObjectId(studentId),
        class_id: student.class_id?._id ?? student.class_id,
        academic_year_id: academicYearId ? new Types.ObjectId(academicYearId) : undefined,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_no: referenceNo,
        notes,
        status: "completed",
        allocations,
        received_by: new Types.ObjectId(ctx.user_id)
    });

    return {
        id: String(paymentDoc._id),
        receipt_no: paymentDoc.receipt_no,
        student_id: studentId,
        amount,
        payment_date: paymentDate.toISOString().split("T")[0],
        method: paymentMethod,
        reference_no: referenceNo,
        status: "completed",
        allocated_to: allocations.map((allocation) => ({
            fee_type: String(allocation.fee_type_id ?? ""),
            month: titleCase(String(allocation.month ?? "")),
            amount: allocation.amount,
        }))
    };
}

export async function recordPayment(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = feePaymentRecordSchema.parse(input);
        const student = await StudentModel.findOne(tenantFilter(ctx, { _id: parsed.student_id })).lean();
        if (!student) throw new ControlledError("NOT_FOUND", "Student not found.", 404);

        const payment = await allocatePayment(ctx, {
            studentId: parsed.student_id,
            amount: parsed.amount,
            paymentMethod: parsed.payment_method,
            referenceNo: parsed.reference_no ?? "",
            notes: parsed.notes ?? "",
            paymentDate: parsed.payment_date,
        });

        await writeAuditLog(ctx, {
            action: "create",
            entity_type: "fee",
            entity_id: String(payment.id),
            after: payment,
            metadata: { scope: "payment" }
        });

        return payment;
    });
}

export async function recordBulkPayments(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "create");

        const parsed = feePaymentBulkSchema.parse(input);
        const parentStudentIds = await resolveParentStudentIds(ctx);
        const students = await StudentModel.find(
            tenantFilter(ctx, parentStudentIds.length > 0 ? { _id: { $in: parentStudentIds } } : {})
        ).select("_id").lean();

        const studentId = students[0]?._id ? String(students[0]._id) : undefined;
        if (!studentId) throw new ControlledError("NOT_FOUND", "Student not found.", 404);

        const receipts: string[] = [];
        let processed = 0;
        let failed = 0;
        let totalAmount = 0;

        for (const payment of parsed.payments) {
            try {
                const saved = await allocatePayment(ctx, {
                    studentId,
                    amount: payment.amount,
                    paymentMethod: payment.payment_method,
                    referenceNo: payment.reference_no ?? "",
                    notes: payment.notes ?? "",
                    paymentDate: payment.payment_date,
                });
                receipts.push(saved.receipt_no);
                processed += 1;
                totalAmount += payment.amount;
            } catch {
                failed += 1;
            }
        }

        return {
            total_payments: parsed.payments.length,
            processed,
            failed,
            total_amount: totalAmount,
            receipts
        };
    });
}

export async function listPayments(ctx: RequestContext, filters: Record<string, unknown> = {}): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const query: Record<string, unknown> = tenantFilter(ctx);
        if (filters.student_id) query.student_id = String(filters.student_id);
        if (filters.method) query.payment_method = String(filters.method);
        if (filters.date_from || filters.date_to) {
            query.payment_date = {} as any;
            if (filters.date_from) (query.payment_date as any).$gte = new Date(String(filters.date_from));
            if (filters.date_to) (query.payment_date as any).$lte = new Date(String(filters.date_to));
        }

        const payments = await FeePaymentModel.find(query)
            .populate("student_id", "first_name last_name admission_no")
            .sort({ payment_date: -1, created_at: -1 })
            .lean();

        return {
            payments: payments.map((payment: any) => ({
                receipt_no: payment.receipt_no,
                student_name: `${payment.student_id?.first_name ?? ""} ${payment.student_id?.last_name ?? ""}`.trim(),
                amount: Number(payment.amount ?? 0),
                date: payment.payment_date instanceof Date ? payment.payment_date.toISOString().split("T")[0] : String(payment.payment_date),
                method: payment.payment_method,
                status: payment.status ?? "completed"
            }))
        };
    });
}

export async function getPaymentByReceipt(ctx: RequestContext, receiptNo: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const payment = await FeePaymentModel.findOne(tenantFilter(ctx, { receipt_no: receiptNo }))
            .populate("student_id", "first_name last_name admission_no class_id")
            .populate("class_id", "name")
            .lean();
        if (!payment) throw new ControlledError("NOT_FOUND", "Payment not found.", 404);

        return payment;
    });
}

export async function getDailyCollection(ctx: RequestContext, date?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const target = date ? new Date(date) : new Date();
        target.setHours(0, 0, 0, 0);
        const next = new Date(target);
        next.setDate(next.getDate() + 1);

        const payments = await FeePaymentModel.find(tenantFilter(ctx, { payment_date: { $gte: target, $lt: next }, status: "completed" }))
            .lean();

        const byMethod = payments.reduce<Record<string, number>>((acc, payment: any) => {
            const method = payment.payment_method;
            acc[method] = (acc[method] || 0) + Number(payment.amount ?? 0);
            return acc;
        }, {});

        return {
            collection_date: target.toISOString().split("T")[0],
            total_collected: payments.reduce((sum, payment: any) => sum + Number(payment.amount ?? 0), 0),
            transaction_count: payments.length,
            by_method: byMethod,
            transactions: payments
        };
    });
}

export async function getFeeSummary(ctx: RequestContext, filters: Record<string, unknown> = {}): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const academicYearId = (filters.academic_year_id ? String(filters.academic_year_id) : undefined) ?? (await resolveAcademicYearId(ctx));
        const classIds = academicYearId ? await resolveClassIdsForAcademyCare(ctx, academicYearId) : [];
        const studentCount = await StudentModel.countDocuments(tenantFilter(ctx, { class_id: { $in: classIds }, status: "active" }));
        const fees = (await FeeModel.find(tenantFilter(ctx, academicYearId ? { academic_year_id: academicYearId } : {})).lean()) as MonthlyFeeDoc[];

        const totalFeeAmount = fees.reduce((sum, fee) => sum + Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0), 0);
        const collected = fees.reduce((sum, fee) => sum + Number(fee.paid_amount ?? 0), 0);
        const pending = Math.max(0, totalFeeAmount - collected);

        const byClass = await Promise.all(
            classIds.map(async (classId) => {
                const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: classId })).select("name").lean();
                const classStudents = await StudentModel.countDocuments(tenantFilter(ctx, { class_id: classId, status: "active" }));
                const classFees = fees.filter((fee) => String(fee.class_id) === classId);
                const classTotal = classFees.reduce((sum, fee) => sum + Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0), 0);
                const classCollected = classFees.reduce((sum, fee) => sum + Number(fee.paid_amount ?? 0), 0);
                return {
                    class: classroom?.name ?? "",
                    students: classStudents,
                    total_fee: classTotal,
                    collected: classCollected,
                    percentage: classTotal > 0 ? Number(((classCollected / classTotal) * 100).toFixed(1)) : 0
                };
            })
        );

        return {
            academic_year: academicYearId ? (await AcademicYearModel.findOne(tenantFilter(ctx, { _id: academicYearId })).select("year").lean())?.year ?? "" : "",
            total_students: studentCount,
            total_fee_amount: totalFeeAmount,
            collected,
            pending,
            collection_percentage: totalFeeAmount > 0 ? Number(((collected / totalFeeAmount) * 100).toFixed(1)) : 0,
            by_class: byClass
        };
    });
}

export async function getFeeAnalytics(ctx: RequestContext, filters: Record<string, unknown> = {}): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const parsed = feeAnalyticsFilterSchema.parse(filters ?? {});
        const query: Record<string, unknown> = tenantFilter(ctx);
        if (parsed.academic_year_id) query.academic_year_id = parsed.academic_year_id;
        if (parsed.class_id) query.class_id = parsed.class_id;

        const fees = (await FeeModel.find(query).lean()) as MonthlyFeeDoc[];
        const payments = await FeePaymentModel.find(query).lean();
        const classMap = new Map<string, string>();
        const classIds = Array.from(new Set(fees.map((fee) => String(fee.class_id)).filter(Boolean)));
        const classes = await ClassModel.find(tenantFilter(ctx, { _id: { $in: classIds } })).select("name").lean();
        classes.forEach((classRow: any) => classMap.set(String(classRow._id), classRow.name));

        const monthlyTrend = new Map<string, { collected: number; count: number }>();
        payments.forEach((payment: any) => {
            const date = payment.payment_date instanceof Date ? payment.payment_date : new Date(payment.payment_date);
            const key = `${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`;
            const entry = monthlyTrend.get(key) ?? { collected: 0, count: 0 };
            entry.collected += Number(payment.amount ?? 0);
            entry.count += 1;
            monthlyTrend.set(key, entry);
        });

        const paymentMethodDistribution = payments.reduce<Record<string, number>>((acc, payment: any) => {
            acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
            return acc;
        }, {});

        const collectionByClass = classIds.map((classId) => {
            const classFees = fees.filter((fee) => String(fee.class_id) === classId);
            const total = classFees.reduce((sum, fee) => sum + Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0), 0);
            const collected = classFees.reduce((sum, fee) => sum + Number(fee.paid_amount ?? 0), 0);
            return {
                class: classMap.get(classId) ?? "",
                percentage: total > 0 ? Number(((collected / total) * 100).toFixed(1)) : 0,
                trend: collected >= total ? "improving" : "watch"
            };
        });

        const defaulters = await getFeeDefaulters(ctx, parsed);

        return {
            collection_trend: {
                monthly: Array.from(monthlyTrend.entries()).map(([month, value]) => ({ month, collected: value.collected, percentage: value.count > 0 ? Number((value.collected / value.count).toFixed(1)) : 0 }))
            },
            payment_method_distribution: paymentMethodDistribution,
            collection_by_class: collectionByClass,
            top_defaulters: (defaulters.ok ? (defaulters.data as any).defaulters : []).slice(0, 10).map((item: any) => ({
                student: item.student_name,
                pending: item.total_pending,
                percentage_paid: item.percentage_paid
            }))
        };
    });
}

export async function getFeeDefaulters(ctx: RequestContext, filters: Record<string, unknown> = {}): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const query: Record<string, unknown> = tenantFilter(ctx);
        if (filters.class_id) query.class_id = String(filters.class_id);
        if (filters.min_amount) query.paid_amount = { $lt: Number(filters.min_amount) };

        const fees = (await FeeModel.find(tenantFilter(ctx, { status: { $in: ["unpaid", "partial"] } }))
            .populate("student_id", "first_name last_name admission_no guardian class_id")
            .populate("class_id", "name")
            .lean()) as any[];

        const now = new Date();
        const defaulters = fees
            .filter((fee) => {
                if (filters.days_overdue) {
                    const daysOverdue = Math.floor((now.getTime() - new Date(String(fee.due_at)).getTime()) / (1000 * 60 * 60 * 24));
                    return daysOverdue >= Number(filters.days_overdue);
                }
                if (filters.class_id && String(fee.class_id?._id ?? fee.class_id) !== String(filters.class_id)) {
                    return false;
                }
                return new Date(String(fee.due_at)) < now;
            })
            .map((fee) => {
                const total = Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0);
                const paid = Number(fee.paid_amount ?? 0);
                const pending = Math.max(0, total - paid);
                const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(String(fee.due_at)).getTime()) / (1000 * 60 * 60 * 24)));
                return {
                    student_id: String(fee.student_id?._id ?? fee.student_id),
                    student_name: `${fee.student_id?.first_name ?? ""} ${fee.student_id?.last_name ?? ""}`.trim(),
                    class: fee.class_id?.name ?? "",
                    roll_no: fee.student_id?.admission_no ?? "",
                    total_pending: pending,
                    months_pending: fee.month ? [titleCase(fee.month)] : [monthLabelFromDate(new Date(String(fee.due_at)))],
                    days_overdue: daysOverdue,
                    guardian_phone: fee.student_id?.guardian?.phone ?? "",
                    guardian_email: fee.student_id?.guardian?.email ?? "",
                    percentage_paid: total > 0 ? Number(((paid / total) * 100).toFixed(1)) : 0
                };
            })
            .filter((item) => item.total_pending > 0);

        return {
            defaulters,
            total_defaulters: defaulters.length,
            total_pending_amount: defaulters.reduce((sum, item) => sum + Number(item.total_pending ?? 0), 0)
        };
    });
}

export async function getStudentFees(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const parentStudentIds = await resolveParentStudentIds(ctx);
        const student = await loadStudentForContext(ctx, studentId ?? parentStudentIds[0]);
        const allStudentIds = ctx.role === "parent" && parentStudentIds.length > 0 ? parentStudentIds : [String(student._id)];

        const students = await StudentModel.find(tenantFilter(ctx, { _id: { $in: allStudentIds } }))
            .populate("class_id", "name section academic_year grade_thresholds academy_care_id")
            .lean();

        const children = await Promise.all(students.map(async (child: any): Promise<ParentFeeChild> => {
            const className = child.class_id?.name ?? "";
            const fees = (await FeeModel.find(tenantFilter(ctx, { student_id: child._id }))
                .sort({ due_at: 1 })
                .lean()) as MonthlyFeeDoc[];
            const total = fees.reduce((sum, fee) => sum + Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0), 0);
            const paid = fees.reduce((sum, fee) => sum + Number(fee.paid_amount ?? 0), 0);
            const pending = Math.max(0, total - paid);
            const percentagePaid = total > 0 ? Number(((paid / total) * 100).toFixed(1)) : 0;

            return {
                student_id: String(child._id),
                student_name: `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim(),
                class_name: className,
                fee_summary: {
                    total_fee: total,
                    paid,
                    pending,
                    percentage_paid: percentagePaid,
                    status: paid <= 0 ? "unpaid" : pending > 0 ? "partial" : "paid",
                },
                monthly_fees: fees.map((fee) => ({
                    id: String(fee._id),
                    month: fee.month ? monthYearLabel(fee.month, Number(fee.year ?? new Date(String(fee.due_at)).getFullYear())) : monthLabelFromDate(new Date(String(fee.due_at))),
                    total: Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0),
                    paid: Number(fee.paid_amount ?? 0),
                    pending: Math.max(0, Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0) - Number(fee.paid_amount ?? 0)),
                    status: feeStatus(Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0), Number(fee.paid_amount ?? 0)),
                    due_date: fee.due_at instanceof Date ? fee.due_at.toISOString().split("T")[0] : String(fee.due_at ?? ""),
                })),
                due_notices: fees
                    .filter((fee) => Math.max(0, Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0) - Number(fee.paid_amount ?? 0)) > 0 && new Date(String(fee.due_at)) < new Date())
                    .map((fee) => ({
                        month: fee.month ? monthYearLabel(fee.month, Number(fee.year ?? new Date(String(fee.due_at)).getFullYear())) : monthLabelFromDate(new Date(String(fee.due_at))),
                        pending: Math.max(0, Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0) - Number(fee.paid_amount ?? 0)),
                        due_date: fee.due_at instanceof Date ? fee.due_at.toISOString().split("T")[0] : String(fee.due_at ?? ""),
                        days_overdue: Math.max(0, Math.floor((Date.now() - new Date(String(fee.due_at)).getTime()) / (1000 * 60 * 60 * 24)))
                    }))
            };
        }));

        return {
            students: children,
            student: children[0]?.student_name ?? "",
            class: children[0]?.class_name ?? "",
            fee_summary: children[0]?.fee_summary ?? { total_fee: 0, paid: 0, pending: 0, percentage_paid: 0, status: "unpaid" },
            monthly_fees: children[0]?.monthly_fees ?? [],
            due_notices: children[0]?.due_notices ?? []
        };
    });
}
