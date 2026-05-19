## 2024-05-20 - Insecure Randomness in ID Generation
**Vulnerability:** Weak random number generation using `math/rand` for critical IDs (invoice numbers, receipt numbers) in the Go backend.
**Learning:** `math/rand` generates predictable sequences, making identifiers susceptible to guessing or brute-force attacks if the internal state is known or inferable, which can lead to data leakage or insecure direct object references (IDOR) if these IDs are used as primary keys without sufficient authorization checks.
**Prevention:** Always use `crypto/rand` from the Go standard library for generating any tokens, IDs, or secrets that require cryptographic unpredictability.
