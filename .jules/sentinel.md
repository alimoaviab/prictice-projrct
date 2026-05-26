
## 2024-05-28 - Insecure Randomness in Identifiers
**Vulnerability:** The codebase was using `math/rand` to generate random entropy for critical identifiers such as invoice numbers, receipt numbers, certificate numbers, and certificate verification codes.
**Learning:** `math/rand` is a pseudo-random number generator that is cryptographically insecure and predictable. It relies on a weak seed and its output sequence can be guessed. This could allow attackers to predict valid invoice IDs, receipt IDs, or guess certificate verification codes, leading to insecure direct object references or verification bypass. Go applications should avoid `math/rand` for identifiers where unpredictability is a security requirement.
**Prevention:** Always use `crypto/rand` to generate secure random bytes. Implement a fallback (like timestamp-based) in case the system entropy pool fails, to prevent panics, and safely encode the bytes (e.g., as hexadecimal strings) to form the identifiers.
