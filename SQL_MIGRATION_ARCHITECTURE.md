# Enterprise SQL Migration Architecture

This document details the comprehensive strategy and technical specifications for migrating the School Management System from its current Mongoose/MongoDB architecture to a professional PostgreSQL environment using Prisma ORM.

## 1. Current MongoDB Problems

The existing MongoDB architecture exhibits several critical limitations that hinder its ability to scale effectively as an enterprise SaaS platform:

- **Lack of Referential Integrity:** Relationships between `Student`, `Class`, `Teacher`, `Fee`, etc., are loose. Deleted records leave orphaned IDs in referencing arrays (e.g., `teacher.subject_ids` or `student.subjects`).
- **N+1 Queries & Difficult Joins:** Generating composite reports, such as a student's full profile including their class, teacher details, parent details, and fee balances, requires manual `$lookup` pipelines which become unmaintainable or inefficient loop-based fetching.
- **Unbounded Arrays:** The `submissions` array in `Homework` or `marks` array in `Exam` models create the risk of documents exceeding the 16MB BSON size limit as a class scales over an academic year.
- **Weak Typing & Consistency:** Schemas use untyped strings and loose embedded documents (e.g., `guardian` in `Student`, nested arrays in `Fee`).
- **Transaction Complexity:** Updating a fee balance and generating a payment receipt involves multi-document operations, which in MongoDB requires complex transaction logic not strictly enforced by schemas.

## 2. Why SQL Is Better

PostgreSQL is vastly superior for this enterprise School ERP system:

| Feature | MongoDB | PostgreSQL |
|----------|-------------|-------------|
| **Relationships** | Manual `$lookup`, prone to orphaned data | Enforced Foreign Keys (FKs) with strict cascading rules |
| **Query Performance** | Slow on complex aggregations | Extremely fast complex JOINs with structured indexes |
| **Transactions** | Optional, complex to implement | Native ACID compliance for financial/academic operations |
| **Analytics & Reporting** | Needs external ETL or heavy pipelines | Native materialized views, Window Functions for ranking |
| **Data Integrity** | Schema validation is application-side | Database-level constraints (UNIQUE, CHECK, NOT NULL) |
| **Scalability** | Good for flat reads, poor for deep joins | Highly scalable with connection pooling and indexing |
| **School ERP Suitability**| Poor (highly relational data) | Excellent (predictable schemas, structured finance) |

**Conclusion:** School domains are inherently relational (School -> Academic Year -> Class -> Student -> Fees/Results). Relational databases mathematically map to this domain structure perfectly.

## 3. PostgreSQL Architecture

The new architecture will utilize PostgreSQL with the following enterprise-grade characteristics:

- **Multi-Tenancy:** Every table will contain a `schoolId` column (foreign key to `School`). A composite primary key or Row-Level Security (RLS) can be implemented to ensure cross-tenant data isolation.
- **Constraints & Constraints:** `CHECK` constraints on financial amounts (e.g., `amount >= 0`). `UNIQUE` constraints on logical identifiers per school (e.g., `schoolId` + `admissionNo` on Student).
- **Soft Deletes:** Standardizing on a `deletedAt` timestamp instead of relying purely on an `active`/`inactive` status enum to allow data recovery.
- **Audit Logs:** Implementation of trigger-based audit logs for sensitive tables (`Fees`, `Users`, `Results`) to track who made changes and when.
- **Indexing Strategy:**
  - B-Tree indexes on all Foreign Keys.
  - Composite indexes for multi-tenant querying (e.g., `CREATE INDEX idx_student_school_class ON "Student"("schoolId", "classId");`).

## 4. Prisma Schema Design

Below is the optimized Prisma schema demonstrating the refactored architecture, utilizing Best Practices like specific mapped table names (`@@map`) and enums.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --------------------------------------------------
// ENUMS
// --------------------------------------------------
enum Role {
  SUPER_ADMIN
  ADMIN
  TEACHER
  PARENT
  STUDENT
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

enum FeeStatus {
  UNPAID
  PARTIAL
  PAID
  VOID
}

// --------------------------------------------------
// CORE MODELS
// --------------------------------------------------
model School {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users          User[]
  academicYears  AcademicYear[]
  classes        Class[]
  students       Student[]
  teachers       Teacher[]
  subjects       Subject[]

  @@map("schools")
}

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId     String   @db.Uuid
  email        String
  passwordHash String
  role         Role
  firstName    String
  lastName     String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  school       School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  teacher      Teacher?
  parents      Parent[]
  student      Student?

  @@unique([schoolId, email])
  @@index([schoolId, role])
  @@map("users")
}

model AcademicYear {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId  String   @db.Uuid
  year      String
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(false)

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classes   Class[]

  @@unique([schoolId, year])
  @@map("academic_years")
}

// --------------------------------------------------
// ACADEMIC MODELS
// --------------------------------------------------
model Subject {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId    String   @db.Uuid
  name        String
  code        String?

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classes     ClassSubject[]
  teachers    TeacherSubject[]

  @@unique([schoolId, name])
  @@map("subjects")
}

model Teacher {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId    String   @db.Uuid
  userId      String   @unique @db.Uuid
  employeeNo  String

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  classesManaged Class[] @relation("ClassTeacher")
  subjects    TeacherSubject[]

  @@unique([schoolId, employeeNo])
  @@map("teachers")
}

model Class {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId       String   @db.Uuid
  academicYearId String   @db.Uuid
  name           String
  classTeacherId String?  @db.Uuid

  school         School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  classTeacher   Teacher?     @relation("ClassTeacher", fields: [classTeacherId], references: [id], onDelete: SetNull)

  students       Student[]
  subjects       ClassSubject[]
  attendances    Attendance[]

  @@unique([schoolId, name, academicYearId])
  @@map("classes")
}

// Join Tables for Many-to-Many
model ClassSubject {
  classId   String @db.Uuid
  subjectId String @db.Uuid
  class     Class  @relation(fields: [classId], references: [id], onDelete: Cascade)
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@id([classId, subjectId])
  @@map("class_subjects")
}

model TeacherSubject {
  teacherId String @db.Uuid
  subjectId String @db.Uuid
  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@id([teacherId, subjectId])
  @@map("teacher_subjects")
}

model Student {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId    String   @db.Uuid
  userId      String   @unique @db.Uuid
  classId     String   @db.Uuid
  admissionNo String

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  class       Class    @relation(fields: [classId], references: [id], onDelete: Restrict)

  parents     ParentStudent[]
  attendances Attendance[]
  fees        Fee[]

  @@unique([schoolId, admissionNo])
  @@index([schoolId, classId])
  @@map("students")
}

model Parent {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @db.Uuid

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  students    ParentStudent[]

  @@map("parents")
}

model ParentStudent {
  parentId  String @db.Uuid
  studentId String @db.Uuid
  parent    Parent  @relation(fields: [parentId], references: [id], onDelete: Cascade)
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@id([parentId, studentId])
  @@map("parent_students")
}

// --------------------------------------------------
// OPERATIONS & FINANCE
// --------------------------------------------------
model Attendance {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  classId   String   @db.Uuid
  studentId String   @db.Uuid
  date      DateTime @db.Date
  status    AttendanceStatus

  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, date])
  @@index([classId, date])
  @@map("attendances")
}

model Fee {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  studentId   String   @db.Uuid
  invoiceNo   String   @unique
  title       String
  amount      Decimal  @db.Decimal(10, 2)
  paidAmount  Decimal  @default(0.00) @db.Decimal(10, 2)
  dueAt       DateTime
  status      FeeStatus @default(UNPAID)

  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  payments    FeePayment[]

  @@index([studentId, status])
  @@map("fees")
}

model FeePayment {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  feeId       String   @db.Uuid
  receiptNo   String   @unique
  amount      Decimal  @db.Decimal(10, 2)
  paymentDate DateTime @default(now())

  fee         Fee      @relation(fields: [feeId], references: [id], onDelete: Cascade)

  @@map("fee_payments")
}
```

## 5. Table Relationships Explained

- **One-to-One:** `User` has a 1:1 relationship with `Student`, `Teacher`, and `Parent` profiles. This separation keeps the `User` table lean for auth purposes, while holding specialized logic in the profiles.
- **One-to-Many:** A `School` has many `Classes`, a `Class` has many `Students`, a `Student` has many `Fees`. This cascades properly.
- **Many-to-Many:** Modeled explicitly via join tables (`ClassSubject`, `TeacherSubject`, `ParentStudent`). Explicit join tables allow us to add metadata later (e.g., `isPrimaryParent` on `ParentStudent`).

## 6. Next.js Folder Structure

A modern Next.js App Router (v15+) architecture optimized for this domain:

```
/apps
  /school-app
    /app               # Next.js App Router (Pages, Layouts, API Routes)
      /(dashboard)     # Dashboard layouts
      /api             # Edge/Node API Routes
    /components        # UI, Forms, Data Tables
/packages
  /shared
    /prisma           # Prisma Schema and Migrations
      schema.prisma
      /migrations
    /db               # Database connection & pooling logic
    /actions          # Next.js Server Actions (Mutations)
    /repositories     # Data Access Layer (Abstraction over Prisma)
    /services         # Business Logic Layer (Uses repositories)
    /hooks            # SWR/React Query hooks wrapping Server Actions/APIs
    /types            # Zod Validation schemas and TS types
```

## 7. API Refactor Plan

Currently, logic is tightly coupled inside API endpoints. The refactoring strategy:

1. **Controllers (API Routes / Server Actions):** Solely responsible for receiving HTTP requests, verifying auth, validating payloads (via Zod), and returning standardized JSON.
2. **Services Layer:** Contains business logic. E.g., `FeeService.payFee(feeId, amount)`. This layer initiates database transactions.
3. **Repository Layer:** Abstract database calls. `PrismaStudentRepository.findById()`. This makes testing significantly easier by allowing repository mocking.
4. **Data Fetching:** For read-heavy operations, move away from client-side `fetch` towards React Server Components (RSCs) directly invoking the Repository layer, falling back to Next.js Server Actions for mutations.

## 8. Performance Optimizations

- **Addressing N+1 Queries:** Prisma automatically batches queries using the DataLoader pattern under the hood. However, deep `include` statements should be avoided. Use specific `select` objects to retrieve only necessary fields.
- **Pagination & Filtering:** Offset pagination (`skip`/`take`) will be replaced with cursor-based pagination for large datasets (e.g., Audit Logs, global Student lists).
- **Indexing:** B-Tree indexes created on all Foreign Keys. Composite indexes created for common query patterns (e.g., `schoolId` + `classId` + `status` for fetching active students in a class).
- **Caching Strategy:** Wrap heavy analytical queries (e.g., Dashboard stats) with Next.js `unstable_cache` or a Redis layer (using `next/cache` revalidation paths on data mutation).

## 9. Security Architecture

- **Authentication:** Continue using JWTs, but validate them at the Edge using Next.js Middleware before the request hits the node environment.
- **Role-Based Access Control (RBAC):** RLS (Row Level Security) at the PostgreSQL database level is highly recommended to ensure `schoolId` boundaries are mathematically impossible to breach, even if an application-layer bug occurs.
- **SQL Injection:** Handled natively by Prisma's parameterized queries.
- **Validation:** Strict Zod schemas validating all Server Action inputs and API route payloads.

## 10. Migration Steps

1. **Schema Finalization:** Review and refine the `schema.prisma`.
2. **Setup Prisma & Postgres:** Initialize the DB and run `npx prisma migrate dev`.
3. **Data Extraction Script:** Write a Node.js script using Mongoose to read the MongoDB collections.
4. **Data Transformation & Seeding:** The script translates BSON ObjectIds to UUIDs (or maps them). It flattens arrays into relationship table inserts.
5. **Dry Run:** Execute the script against a staging Postgres instance to verify referential integrity (e.g., no orphaned students).
6. **Codebase Overhaul:** Rewrite the `/shared/services` layer to use Prisma instead of Mongoose.
7. **Production Cutover:** Enter maintenance mode, run the final sync script, swap environmental variables, and deploy the updated application.

## 11. Deployment Strategy

- **Database:** Managed PostgreSQL (e.g., AWS RDS, Supabase, Vercel Postgres) with PgBouncer connection pooling enabled.
- **Application:** Deploy the Next.js apps via Vercel or Dockerized containers on AWS ECS.
- **Migrations:** Prisma migrations must be run as a separate pre-deployment step in the CI/CD pipeline (`npx prisma migrate deploy`), NOT during app startup.

## 12. Production Best Practices

- **Strict Mode:** TypeScript `strict: true` across all packages.
- **Result Pattern:** Continue using the `@edu/shared/utils/result` pattern (`ok()`, `fail()`) rather than throwing raw Errors for expected business logic violations.
- **Connection Pooling:** Because Next.js serverless functions spin up rapidly, direct connections exhaust DB limits. Use a connection pooler.
- **Logging:** Implement structured JSON logging (Winston/Pino) instead of raw `console.log`, capturing `requestId` and `userId` for tracing.
