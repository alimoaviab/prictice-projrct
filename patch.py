import sys

with open('shared/services/fee-flow.service.ts', 'r') as f:
    content = f.read()

# Add mongoose import
content = content.replace(
    'import { Types } from "mongoose";',
    'import mongoose, { Types } from "mongoose";'
)

# Find the allocatePayment function body
target = """    let remaining = amount;
    const allocations: Array<{ fee_id: unknown; fee_type_id?: unknown; month?: string; amount: number }> = [];

    for (let index = 0; index < fees.length && remaining > 0; index += 1) {"""

replacement = """    let remaining = amount;
    const allocations: Array<{ fee_id: unknown; fee_type_id?: unknown; month?: string; amount: number }> = [];

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        for (let index = 0; index < fees.length && remaining > 0; index += 1) {"""

content = content.replace(target, replacement)

# Fix findOneAndUpdate to use session
target = """                $push: {
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
        ).lean();"""

replacement = """                $push: {
                    payments: {
                        amount: allocated,
                        paid_at: paymentDate,
                        method: paymentMethod,
                        reference: referenceNo,
                        received_by: new Types.ObjectId(ctx.user_id),
                    }
                }
            },
            { new: true, session }
        ).lean();"""

content = content.replace(target, replacement)

# Replace FeePaymentModel.create to use array and session
target = """    const paymentDoc = await FeePaymentModel.create({
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
    });"""

replacement = """    const paymentDocs = await FeePaymentModel.create([{
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
    }], { session });

    const paymentDoc = paymentDocs[0];

    await session.commitTransaction();
    session.endSession();"""

content = content.replace(target, replacement)

# Add catch block
target = """        allocated_to: allocations.map((allocation) => ({
            fee_type: String(allocation.fee_type_id ?? ""),
            month: titleCase(String(allocation.month ?? "")),
            amount: allocation.amount,
        }))
    };
}

export async function recordPayment(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {"""

replacement = """        allocated_to: allocations.map((allocation) => ({
            fee_type: String(allocation.fee_type_id ?? ""),
            month: titleCase(String(allocation.month ?? "")),
            amount: allocation.amount,
        }))
    };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

export async function recordPayment(ctx: RequestContext, input: unknown): Promise<ServiceResult<unknown>> {"""

content = content.replace(target, replacement)

with open('shared/services/fee-flow.service.ts', 'w') as f:
    f.write(content)
