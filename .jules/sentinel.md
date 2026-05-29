## 2025-05-29 - [CRITICAL] Fix Cryptographically Weak PRNG in Backend
**Vulnerability:** Predictable random numbers generated using `math/rand` for critical application tokens.
**Learning:** `math/rand` is not cryptographically secure and the predictability can lead to security risks, specially in the creation of Verification Codes, Certificates and Invoice/Receipt Identifiers.
**Prevention:** Avoid `math/rand` for IDs and verification tokens; always prefer `crypto/rand` from the start and explicitly handle underlying system randomness failures (e.g. `err != nil`) by falling back securely.
