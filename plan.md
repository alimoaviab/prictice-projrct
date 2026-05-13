1. **Implement Finance/Fee Module Fixes**
   - Refactor `shared/services/fee-flow.service.ts` to address the critical issues identified in the audit report:
     - Wrap the payment allocation logic in `recordPayment` within a MongoDB transaction.
     - Optimize the N+1 query pattern in `generateMonthlyFees` using bulk operations.
     - Address race conditions in fee generation.
     - Fix floating-point math issues by using integer arithmetic (cents) or a decimal library (since we don't have one installed, we'll implement a simple integer conversion utility).

2. **Verify System Integrity**
   - Run `npx turbo run build` to ensure the refactored code compiles without errors.

3. **Complete pre-commit steps**
   - Request another code review and address any feedback.

4. **Submit the Report and Fixes**
   - Commit the generated `audit_report.md` and the updated `fee-flow.service.ts` using the submit tool.
