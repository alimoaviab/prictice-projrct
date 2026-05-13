import sys

with open('shared/services/fee-flow.service.ts', 'r') as f:
    content = f.read()

target = """                if (existing) {
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
                });"""

replacement = """                const invoiceNo = makeInvoiceNo(String(student._id), parsed.month, parsed.year);

                bulkOps.push({
                    updateOne: {
                        filter: tenantFilter(ctx, {
                            student_id: student._id,
                            academic_year_id: academicYearId,
                            month: parsed.month.toLowerCase(),
                            year: parsed.year
                        }),
                        update: {
                            $set: {
                                class_id: student.class_id,
                                fee_type_id: applicableFees[0]?.fee_type_id ?? undefined,
                                title: `Fees for ${monthYearLabel(parsed.month, parsed.year)}`,
                                amount: invoiceAmount,
                                due_at: end,
                                status: existing ? feeStatus(invoiceAmount, Number(existing.paid_amount ?? 0)) : "unpaid",
                                fee_components: feeComponents,
                                adjustment_amount: adjustmentAmount,
                            },
                            $setOnInsert: {
                                school_id: ctx.school_id,
                                invoice_no: invoiceNo,
                                currency: "USD",
                                paid_amount: 0,
                                generated_at: new Date(),
                                generated_by: new Types.ObjectId(ctx.user_id),
                                payments: [],
                            }
                        },
                        upsert: true
                    }
                });

                feesGenerated += 1;
                totalAmountGenerated += invoiceAmount;"""

if target in content:
    content = content.replace(target, replacement)
    with open('shared/services/fee-flow.service.ts', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
