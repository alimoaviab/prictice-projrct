import sys

with open('shared/services/fee-flow.service.ts', 'r') as f:
    content = f.read()

target = """    let remaining = amount;
    const allocations: Array<{ fee_id: unknown; fee_type_id?: unknown; month?: string; amount: number }> = [];

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        for (let index = 0; index < fees.length && remaining > 0; index += 1) {
        const fee = fees[index];
        const currentOutstanding = outstanding[index];
        if (currentOutstanding <= 0) continue;

        const allocated = Math.min(remaining, currentOutstanding);
        remaining -= allocated;

        const totalAfterAdjustment = Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0);
        const paidBefore = Number(fee.paid_amount ?? 0);
        const paidAfter = paidBefore + allocated;
        const newStatus = feeStatus(totalAfterAdjustment, paidAfter);"""

replacement = """    let remainingCents = Math.round(amount * 100);
    const allocations: Array<{ fee_id: unknown; fee_type_id?: unknown; month?: string; amount: number }> = [];

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        for (let index = 0; index < fees.length && remainingCents > 0; index += 1) {
        const fee = fees[index];
        const currentOutstandingCents = Math.round(outstanding[index] * 100);
        if (currentOutstandingCents <= 0) continue;

        const allocatedCents = Math.min(remainingCents, currentOutstandingCents);
        remainingCents -= allocatedCents;
        const allocated = allocatedCents / 100;

        const totalAfterAdjustment = Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0);
        const paidBefore = Number(fee.paid_amount ?? 0);
        const paidAfter = (Math.round(paidBefore * 100) + allocatedCents) / 100;
        const newStatus = feeStatus(totalAfterAdjustment, paidAfter);"""

if target in content:
    content = content.replace(target, replacement)
    with open('shared/services/fee-flow.service.ts', 'w') as f:
        f.write(content)
    print("Success fixing allocation cents")
else:
    print("Target allocation cents not found")
