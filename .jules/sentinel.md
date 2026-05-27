## 2026-05-27 - [Insecure Random Number Generation]
**Vulnerability:** Weak PRNG using `math/rand` to generate security-sensitive identifiers (Invoice Numbers and Verification Codes/Certificate Numbers).
**Learning:** In Go, `math/rand` is a predictable pseudorandom number generator, meaning the random sequence can be reproduced if the initial state is known. It should not be used in security contexts or where uniqueness/unpredictability is required.
**Prevention:** Always use `crypto/rand` to generate cryptographically secure random values. Fallback to highly unique values such as `time.Now().UnixNano()` if the entropy pool is temporarily exhausted, making sure errors returned by `crypto/rand` are properly handled.
