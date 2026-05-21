## 2025-02-21 - Insecure random number generation used for ID creation
**Vulnerability:** System used `math/rand` to generate IDs and unique identifiers (e.g. `makeInvoiceNo`, `makeReceiptNo` and `generateVerificationCode`). `math/rand` generates pseudo-random numbers which are deterministic and predictable, and poses a risk when creating IDs or tokens intended to be unique and secure.
**Learning:** `math/rand` was imported instead of the secure alternative `crypto/rand`.
**Prevention:** For sensitive operations, token creation, or unique identifier generation, always use cryptographically secure sources of random numbers such as `crypto/rand`.
