import sys

with open('/Users/ali/Desktop/EDUEXPLO/Eduplexo/shared/services/fee-flow.service.ts', 'a') as f:
    f.write("""
export async function getFeeDashboardStats(ctx: RequestContext): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const academicYearId = await resolveAcademicYearId(ctx);
        const fees = (await FeeModel.find(tenantFilter(ctx, academicYearId ? { academic_year_id: academicYearId } : {})).lean()) as MonthlyFeeDoc[];
        const classIds = academicYearId ? await resolveClassIdsForAcademicYear(ctx, academicYearId) : [];

        const now = new Date();
        const currentMonth = monthLabelFromDate(now).split(" ")[0].toLowerCase();
        const currentYear = now.getFullYear();

        const currentMonthFees = fees.filter(f => f.month === currentMonth && f.year === currentYear);
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = monthLabelFromDate(prevMonthDate).split(" ")[0].toLowerCase();
        const prevYear = prevMonthDate.getFullYear();
        const prevMonthFees = fees.filter(f => f.month === prevMonth && f.year === prevYear);

        const currentTotal = currentMonthFees.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0);
        const prevTotal = prevMonthFees.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0);
        
        let growth = 0;
        if (prevTotal > 0) {
            growth = Number((((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1));
        }

        const currentPending = currentMonthFees.reduce((acc, f) => acc + Math.max(0, (Number(f.amount) || 0) + (Number(f.adjustment_amount) || 0) - (Number(f.paid_amount) || 0)), 0);
        const ratio = currentPending === 0 ? "All Paid" : `${currentTotal}:${currentPending}`;

        const defaultersFees = fees.filter(f => {
            const due = new Date(String(f.due_at));
            const isUnpaid = ((Number(f.amount) || 0) + (Number(f.adjustment_amount) || 0)) > (Number(f.paid_amount) || 0);
            return isUnpaid && due < now;
        });

        const defaulterCount = new Set(defaultersFees.map(f => String(f.student_id))).size;
        const overdueAmount = defaultersFees.reduce((acc, f) => acc + Math.max(0, (Number(f.amount) || 0) + (Number(f.adjustment_amount) || 0) - (Number(f.paid_amount) || 0)), 0);

        const totalExpected = fees.reduce((acc, f) => acc + (Number(f.amount) || 0) + (Number(f.adjustment_amount) || 0), 0);
        const totalPaid = fees.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0);
        const paidPercentage = totalExpected > 0 ? Number(((totalPaid / totalExpected) * 100).toFixed(1)) : 0;
        const remainingPercentage = totalExpected > 0 ? Number((100 - paidPercentage).toFixed(1)) : 0;

        const classFees = await ClassFeeModel.find(tenantFilter(ctx, academicYearId ? { academic_year_id: academicYearId } : {})).lean();
        const recurring = classFees.filter((f: any) => f.is_monthly).length;
        const onetime = classFees.filter((f: any) => !f.is_monthly).length;
        const activeClasses = new Set(classFees.map((f: any) => String(f.class_id))).size;

        return {
            monthly_collection: {
                total: currentTotal,
                growth_percentage: growth,
                paid_vs_pending_ratio: ratio,
            },
            defaulters: {
                count: defaulterCount,
                overdue_amount: overdueAmount,
                high_priority: Math.floor(defaulterCount * 0.2), // Mock value
            },
            collection_progress: {
                paid_percentage: paidPercentage,
                remaining_percentage: remainingPercentage,
            },
            active_components: {
                recurring,
                onetime,
                active_classes: activeClasses,
            }
        };
    });
}

export async function getFeeClassesSummary(ctx: RequestContext): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");

        const academicYearId = await resolveAcademicYearId(ctx);
        const classIds = academicYearId ? await resolveClassIdsForAcademicYear(ctx, academicYearId) : [];

        const classes = await ClassModel.find(tenantFilter(ctx, { _id: { $in: classIds } })).populate("academic_year_id", "year").lean();
        const fees = (await FeeModel.find(tenantFilter(ctx, academicYearId ? { academic_year_id: academicYearId } : {})).lean()) as MonthlyFeeDoc[];
        const classFees = await ClassFeeModel.find(tenantFilter(ctx, academicYearId ? { academic_year_id: academicYearId } : {})).lean();
        
        const now = new Date();
        const currentMonth = monthLabelFromDate(now).split(" ")[0].toLowerCase();
        const currentYear = now.getFullYear();

        const results = [];
        for (const c of classes as any[]) {
            const classId = String(c._id);
            const studentCount = await StudentModel.countDocuments(tenantFilter(ctx, { class_id: classId, status: "active" }));
            
            const classConfigFees = classFees.filter((f: any) => String(f.class_id) === classId);
            const monthlyFee = classConfigFees.filter((f: any) => f.is_monthly).reduce((acc, f: any) => acc + (Number(f.amount) || 0), 0);
            
            const cFees = fees.filter(f => String(f.class_id) === classId);
            const cCurrentFees = cFees.filter(f => f.month === currentMonth && f.year === currentYear);
            
            const collectedThisMonth = cCurrentFees.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0);
            const expectedThisMonth = cCurrentFees.reduce((acc, f) => acc + (Number(f.amount) || 0) + (Number(f.adjustment_amount) || 0), 0);
            const pendingThisMonth = Math.max(0, expectedThisMonth - collectedThisMonth);

            const cDefaulters = cFees.filter(f => {
                const due = new Date(String(f.due_at));
                const isUnpaid = ((Number(f.amount) || 0) + (Number(f.adjustment_amount) || 0)) > (Number(f.paid_amount) || 0);
                return isUnpaid && due < now;
            });
            const defaultersCount = new Set(cDefaulters.map(f => String(f.student_id))).size;

            let colPercentage = 0;
            if (expectedThisMonth > 0) {
                colPercentage = Number(((collectedThisMonth / expectedThisMonth) * 100).toFixed(1));
            }

            results.push({
                _id: classId,
                name: c.name,
                section: c.section,
                academic_year: c.academic_year_id?.year || "",
                total_students: studentCount,
                monthly_fee: monthlyFee,
                collected_this_month: collectedThisMonth,
                pending_amount: pendingThisMonth,
                defaulters_count: defaultersCount,
                recurring_components: classConfigFees.filter((f: any) => f.is_monthly).length,
                onetime_components: classConfigFees.filter((f: any) => !f.is_monthly).length,
                collection_percentage: colPercentage,
            });
        }

        return { classes: results };
    });
}
""");

