## 2024-05-20 - [Go Cryptographic Random Handling]
**Vulnerability:** Weak random number generator (`math/rand`) was used for secure values (invoice and certificate generation). This can lead to identifier predictability or collisions.
**Learning:** In Go, `crypto/rand` can return an error as its second value (e.g., if entropy pool is exhausted). Failing to check this error can lead to a nil pointer dereference panic, causing a critical stability bug. Always check for the error return or fall back gracefully.
**Prevention:** Always use `crypto/rand` when generating security identifiers, but strictly enforce checking the returned `err` value to prevent application crashes.
