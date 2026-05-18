## 2024-05-18 - Replacing Insecure Random Number Generation

**Vulnerability:** The Go backend was using `math/rand` to generate sensitive random numbers for functions such as `makeInvoiceNo` and `makeReceiptNo`. `math/rand` is not cryptographically secure and could lead to predictable identifiers.
**Learning:** Found that `math/rand` should be avoided for generating identifiers like invoice or receipt numbers in favor of `crypto/rand`.
**Prevention:** Always use `crypto/rand` when generating unpredictable, security-sensitive identifiers.
