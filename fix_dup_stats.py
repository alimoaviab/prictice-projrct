import sys

with open('shared/services/fee-flow.service.ts', 'r') as f:
    content = f.read()

target = """                feesGenerated += 1;
                totalAmountGenerated += invoiceAmount;

                feesGenerated += 1;
                totalAmountGenerated += invoiceAmount;"""

replacement = """                feesGenerated += 1;
                totalAmountGenerated += invoiceAmount;"""

if target in content:
    content = content.replace(target, replacement)
    with open('shared/services/fee-flow.service.ts', 'w') as f:
        f.write(content)
    print("Success fixing duplication")
else:
    print("Target duplication not found")
