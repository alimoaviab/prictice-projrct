import sys

with open('shared/services/fee-flow.service.ts', 'r') as f:
    content = f.read()

target = """        for (const classId of classIds) {
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
        }"""

replacement = """        const allExistingFees = await FeeModel.find(
            tenantFilter(ctx, {
                student_id: { $in: students.map((s: any) => s._id) },
                academic_year_id: academicYearId,
                month: parsed.month.toLowerCase(),
                year: parsed.year,
            })
        ).lean();

        const existingFeesMap = new Map(allExistingFees.map((f: any) => [String(f.student_id), f]));
        const bulkOps = [];

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

                const existing = existingFeesMap.get(String(student._id));

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
                    bulkOps.push({
                        updateOne: {
                            filter: tenantFilter(ctx, { _id: existing._id }),
                            update: {
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
                            }
                        }
                    });
                    feesGenerated += 1;
                    totalAmountGenerated += invoiceAmount;
                    continue;
                }

                const invoiceNo = makeInvoiceNo(String(student._id), parsed.month, parsed.year);
                bulkOps.push({
                    insertOne: {
                        document: {
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
                        }
                    }
                });

                feesGenerated += 1;
                totalAmountGenerated += invoiceAmount;
            }
        }

        if (bulkOps.length > 0) {
            await FeeModel.bulkWrite(bulkOps, { ordered: false });
        }"""

if target in content:
    content = content.replace(target, replacement)
    with open('shared/services/fee-flow.service.ts', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
