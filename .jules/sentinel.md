## 2025-02-28 - Replace math/rand with crypto/rand for secure identifiers
**Vulnerability:** Weak random number generation using `math/rand` in `makeInvoiceNo` and `makeReceiptNo` functions in `backend-go/internal/domain/fees/fees.go`.
**Learning:** `math/rand` is predictable and not suitable for generating security-sensitive or unique identifiers like invoice and receipt numbers. In Go, it lacks cryptographic security, potentially allowing an attacker to predict generated values.
**Prevention:** Use `crypto/rand` to generate cryptographically secure random numbers. Always handle potential errors from `crypto/rand` by providing a fallback (like `time.Now().UnixNano()`) to prevent nil pointer dereferences and critical stability bugs if the system entropy pool is exhausted.
