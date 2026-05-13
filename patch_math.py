import sys

with open('shared/services/fee-flow.service.ts', 'r') as f:
    content = f.read()

target = """function feeStatus(total: number, paid: number) {
    if (paid <= 0) return "unpaid";
    if (paid >= total) return "paid";
    return "partial";
}"""

replacement = """function feeStatus(total: number, paid: number) {
    const safeTotal = Math.round(total * 100);
    const safePaid = Math.round(paid * 100);
    if (safePaid <= 0) return "unpaid";
    if (safePaid >= safeTotal) return "paid";
    return "partial";
}"""

if target in content:
    content = content.replace(target, replacement)
    with open('shared/services/fee-flow.service.ts', 'w') as f:
        f.write(content)
    print("Success math 1")
else:
    print("Target 1 not found")

target2 = """                const baseAmount = feeComponents.reduce((sum, component) => sum + Number(component.amount ?? 0), 0);
                const invoiceAmount = Math.max(0, baseAmount + adjustmentAmount);"""

replacement2 = """                const baseAmount = feeComponents.reduce((sum, component) => sum + Math.round(Number(component.amount ?? 0) * 100), 0);
                const invoiceAmount = Math.max(0, (baseAmount + Math.round(adjustmentAmount * 100)) / 100);"""

if target2 in content:
    content = content.replace(target2, replacement2)
    with open('shared/services/fee-flow.service.ts', 'w') as f:
        f.write(content)
    print("Success math 2")
else:
    print("Target 2 not found")
