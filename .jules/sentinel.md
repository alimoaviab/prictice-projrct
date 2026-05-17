## 2025-01-20 - Weak Identifier Generation
**Vulnerability:** Weak random number generation using `math/rand` for invoice/receipt numbers in backend-go.
**Learning:** Predictable identifiers could lead to insecure direct object references or enumeration attacks.
**Prevention:** Use `crypto/rand` for security-sensitive identifiers to ensure unpredictability and cryptographic security.
