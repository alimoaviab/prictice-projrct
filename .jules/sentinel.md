
## 2025-02-23 - [MEDIUM] Insecure usage of math/rand for identifiers
**Vulnerability:** The Go backend was using the cryptographically insecure `math/rand` package to generate supposedly unique identifiers for invoices and receipts in `backend-go/internal/domain/fees/fees.go` and for certificates in `backend-go/internal/domain/certificates/certificates.go`.
**Learning:** `math/rand` is predictable and its usage for important business identifiers can lead to collisions or predictability. Furthermore, when substituting `crypto/rand`, it is vital to handle the returned error object. Ignoring `err` could lead to zero-initialized slices or nil pointer panics when system entropy is exhausted.
**Prevention:** Always use `crypto/rand` for identifiers. Always handle `crypto/rand` errors by defining an adequate fallback (e.g., using `time.Now().UnixNano()` if unpredictability isn't strictly required for security, but uniqueness is needed).
