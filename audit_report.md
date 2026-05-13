# Eduplexo ERP Security & Architecture Audit Report

## Executive Summary
This report outlines critical architectural flaws, security vulnerabilities, and logic bugs discovered in the Eduplexo platform during a deep architectural QA investigation. The focus is strictly on production readiness, tenant isolation, and mission-critical enterprise workflows like the Finance/Fee module.

## 1. Finance & Fee Generation Critical Vulnerabilities

### 1.1 Race Condition in Fee Generation
**File:** `shared/services/fee-flow.service.ts: generateMonthlyFees`
**Issue:** When generating monthly fees, the system loops over students, checks for an existing fee record using `FeeModel.findOne`, and then later does an insert/update. This is not atomic. If two administrators (or an admin and an automated cron job) trigger `generateMonthlyFees` concurrently, the initial `findOne` might return null for both, leading to duplicate fee records being created for the same student/month/year.
**Impact:** Duplicate financial ledgers, incorrect billing to parents, data corruption in financial reports.
**Risk:** **CRITICAL**
**Remediation:** Use atomic `findOneAndUpdate` with `upsert: true` or ensure unique database constraints are strictly enforced and handled gracefully during concurrent generation.

### 1.2 Destructive Re-generation (Loss of Payment Data)
**File:** `shared/services/fee-flow.service.ts: generateMonthlyFees`
**Issue:** If `force_regenerate` is true, the system checks if `existing.paid_amount > 0` before throwing a conflict. However, it completely replaces the `fee_components` and recalculates the `amount`. It does not preserve historical payments if the payment amount is exactly 0 but partial payments were made and then voided, or if adjustments were manually added. Moreso, if `paid_amount` check passes, it arbitrarily overwrites the `amount` and `status` with newly calculated values, which could invalidate historical ledgers.
**Impact:** Loss of financial integrity. Generating fees for past months could retroactively change amounts, destroying the immutability of past invoices.
**Risk:** **HIGH**
**Remediation:** Implement strict immutability for past invoices. Once an invoice is generated and the month has passed, or if it has been sent to a parent, it should be locked. Use credit/debit notes instead of direct mutation for adjustments.

### 1.3 Float/Rounding Inconsistencies in Payments
**File:** `shared/services/fee-flow.service.ts`
**Issue:** Financial amounts are stored as standard JavaScript `Number` types (floating-point). In `recordFeePayment` and `generateMonthlyFees`, amounts are calculated using floating-point math (e.g., `Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0) - Number(fee.paid_amount ?? 0)`).
**Impact:** `0.1 + 0.2 !== 0.3`. Small rounding errors will accumulate over time, leading to fees that are never marked as "paid" because the pending amount is `0.00000000000001`, or incorrect totals in accounting ledgers.
**Risk:** **HIGH**
**Remediation:** Use integer arithmetic (e.g., store amounts in cents/smallest currency unit) or use a robust decimal library (like `decimal.js` or `currency.js`) for all financial calculations.

### 1.4 Unbounded Iteration (N+1 Queries & Memory Exhaustion)
**File:** `shared/services/fee-flow.service.ts: generateMonthlyFees`
**Issue:** The service fetches all students for the given classes, groups them in memory, and then iterates through every student, performing multiple database queries inside the loop (`FeeModel.findOne`, `studentAdjustmentsForDate`, `FeeModel.findOneAndUpdate`, `FeeModel.create`). For a school with 5000 students, this will result in 10,000+ sequential database calls.
**Impact:** Severe performance degradation, transaction timeouts, and potential application crashes due to memory exhaustion or database connection pool exhaustion.
**Risk:** **HIGH**
**Remediation:** Refactor to use bulk operations (`insertMany`, `bulkWrite`) and aggregate data beforehand to minimize database roundtrips.

## 2. Multi-Tenant Isolation Failures

### 2.1 Weak Invoice ID Entropy
**File:** `shared/services/fee-flow.service.ts: makeInvoiceNo`
**Issue:** `makeInvoiceNo` uses `Date.now()` and random bytes, hashed, to create an invoice ID. It does not embed the `school_id`. While collisions are unlikely due to the hash, relying solely on an application-level hash without strong database constraints tying the invoice strictly to a tenant can lead to cross-tenant leakage if an API endpoint accepts an `invoice_no` without validating the tenant.
**Impact:** Potential for an attacker to enumerate or guess invoice IDs if the random seed is weak, though mitigated by SHA1.
**Risk:** **MEDIUM**
**Remediation:** Prepend or encode the `school_id` into the invoice number, and ensure database indices on `invoice_no` are compound with `school_id`.

## 3. General Architecture & State Synchronization

### 3.1 Missing Database Transactions
**File:** `shared/services/fee-flow.service.ts: recordFeePayment`
**Issue:** The payment allocation process updates multiple `FeeModel` documents in a loop and then creates a `FeePaymentModel` record. These operations are not wrapped in a MongoDB transaction (`session.withTransaction`).
**Impact:** If the server crashes or the database connection drops halfway through the loop, the system will be left in an inconsistent state. Some fees will be marked as paid, but the corresponding payment receipt will not exist, destroying the ledger.
**Risk:** **CRITICAL**
**Remediation:** Use MongoDB transactions for all multi-document mutations, especially financial transactions.

### 3.2 Pagination and Caching Flaws
**File:** General Service Layer Pattern
**Issue:** The memory prompt indicates a need for memoization and avoiding N+1 queries, yet the fee generation clearly violates this. Furthermore, fetching all students `lean()` without pagination for large schools will crash the Node.js process (Heap OOM).
**Impact:** Scalability is severely compromised for enterprise-sized schools.
**Risk:** **HIGH**
**Remediation:** Implement cursor-based pagination or batch processing streams for background jobs like fee generation.

## Conclusion
The current implementation of the Fee module is not production-ready for an enterprise environment. The lack of database transactions, floating-point math for currency, and N+1 query patterns present significant risks to data integrity and system stability. Immediate refactoring is required before deployment.
