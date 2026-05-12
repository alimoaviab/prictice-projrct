## 2024-05-12 - NoSQL Injection and User Enumeration in Next.js Auth Routes
**Vulnerability:**
1. The Next.js API routes (`auth/login` and `auth/signup`) were blindly accepting request bodies and passing fields like `email` into Mongoose `findOne` queries without validating they were actually strings. This allowed NoSQL Object Injection (e.g. passing `{"email": {"$ne": null}}`).
2. The `auth/login` route failed early when a user was not found, creating a timing discrepancy compared to when a user was found (which required an expensive `scrypt` hash verification).

**Learning:**
In Next.js App Router, `await req.json()` provides no type guarantees. Directly passing parsed JSON values to MongoDB/Mongoose can easily lead to injection attacks and Unhandled Server Errors (500) if methods like `.toLowerCase()` are called on objects. Additionally, user enumeration is possible if the system takes significantly longer to reject a valid email with a bad password than an invalid email.

**Prevention:**
1. Always enforce strict `typeof value === 'string'` checks on all user input before passing it to database queries or calling string methods.
2. Ensure that authentication endpoints take a uniform amount of time to respond by computing a "dummy" hash (e.g., using a pre-generated valid-format hash string) when an email lookup fails.