# 🔒 Multi-Tenant Security Architecture

## Executive Summary

This document describes the enterprise-grade multi-tenant security architecture implemented in the Eduplexo School Management System. The architecture ensures **complete data isolation** between schools and academic years, preventing any possibility of data leakage.

---

## 🎯 Core Security Principles

### 1. **Zero Trust Architecture**
- Never trust frontend filtering
- All security enforced at backend/database layer
- Every query automatically scoped to tenant and academic year

### 2. **Defense in Depth**
- Multiple layers of security validation
- Tenant isolation at database, service, and API layers
- Academic year isolation for temporal data segregation

### 3. **Fail-Safe Defaults**
- Queries default to most restrictive scope
- Missing context = denied access
- Explicit permission required for cross-boundary access

---

## 🏗️ Architecture Components

### 1. Tenant Isolation (School-Level)

Every entity in the system includes `school_id`:

```typescript
{
  school_id: "sch_8f4x92kd91",  // Immutable, indexed
  // ... other fields
}
```

**Enforcement Points:**
- ✅ Database schema (required, immutable field)
- ✅ Mongoose indexes (compound indexes with school_id)
- ✅ Query middleware (`tenantFilter`)
- ✅ JWT token (school_id in payload)
- ✅ API middleware (validates school_id)

### 2. Academic Year Isolation (Temporal)

Time-sensitive entities include `academic_year_id`:

```typescript
{
  school_id: "sch_8f4x92kd91",
  academic_year_id: "ay_2024_2025",  // Required, indexed
  // ... other fields
}
```

**Entities with Academic Year Scope:**
- ✅ Attendance
- ✅ Exams
- ✅ Results
- ✅ Homework
- ✅ Timetables
- ✅ Fees
- ✅ Classes (linked to academic year)

**Entities WITHOUT Academic Year Scope:**
- Users (persist across years)
- Teachers (persist across years)
- Students (persist across years)
- Schools (platform level)

---

## 🔐 Security Layers

### Layer 1: Database Schema

**Tenant Field:**
```typescript
const tenantField = {
  type: String,
  required: true,
  index: true,
  immutable: true,  // Cannot be changed after creation
  trim: true
};
```

**Compound Indexes:**
```typescript
// Ensures uniqueness within tenant + academic year
schema.index({ 
  school_id: 1, 
  academic_year_id: 1, 
  student_id: 1, 
  date: 1 
}, { unique: true });
```

### Layer 2: Query Middleware

**Tenant Filter:**
```typescript
export function tenantFilter<T>(
  ctx: RequestContext,
  filter: FilterQuery<T> = {}
): FilterQuery<T> {
  // Validates school_id from context
  // Prevents cross-tenant queries
  // Throws error if mismatch detected
  return { ...filter, school_id: ctx.school_id };
}
```

**Academic Year Filter:**
```typescript
export function academicYearFilter<T>(
  ctx: RequestContext,
  filter: FilterQuery<T> = {}
): FilterQuery<T> {
  // Validates school_id AND academic_year_id
  // Prevents cross-year queries
  // Automatically adds active academic year
  return { 
    ...filter, 
    school_id: ctx.school_id,
    academic_year_id: ctx.active_academic_year_id 
  };
}
```

### Layer 3: Authentication Context

**JWT Payload:**
```typescript
{
  sub: "user_id",
  school_id: "sch_8f4x92kd91",
  role: "admin",
  permissions: ["students:view", "students:create"],
  active_academic_year_id: "ay_2024_2025",  // CRITICAL
  session_id: "uuid",
  app: "school"
}
```

**Context Extraction:**
```typescript
const ctx = authenticateRequest(request, "school");
// ctx.school_id → from JWT
// ctx.active_academic_year_id → from JWT
// ctx.role → from JWT
```

### Layer 4: Service Layer

**Example: Student Service**
```typescript
export async function listStudents(ctx: RequestContext) {
  // Automatic tenant filtering
  const query = tenantFilter(ctx, { status: "active" });
  return StudentModel.find(query);
}
```

**Example: Attendance Service**
```typescript
export async function listAttendance(ctx: RequestContext) {
  // Automatic tenant + academic year filtering
  const query = academicYearFilter(ctx, { date: today });
  return AttendanceModel.find(query);
}
```

### Layer 5: API Layer

**Route Protection:**
```typescript
export async function GET(request: NextRequest) {
  // Authenticate and extract context
  const ctx = authenticateRequest(sessionRequest(request), "school");
  
  // Audit security
  auditRequest(ctx, { 
    requireAcademicYear: true,
    allowedRoles: ["admin", "teacher"]
  });
  
  // Service call (automatically scoped)
  const result = await listAttendance(ctx);
  
  return NextResponse.json(result);
}
```

---

## 🔄 Academic Year Switching

### How It Works

1. **Admin initiates switch:**
   ```typescript
   POST /api/academic-years/switch
   { "academic_year_id": "ay_2023_2024" }
   ```

2. **System validates:**
   - Academic year exists
   - Academic year belongs to same school
   - User has admin role

3. **New JWT issued:**
   ```typescript
   {
     ...existingPayload,
     active_academic_year_id: "ay_2023_2024",  // Updated
     session_id: "new_uuid"  // New session
   }
   ```

4. **All subsequent queries automatically filtered:**
   ```typescript
   // Before switch: sees 2024-2025 data
   // After switch: sees 2023-2024 data
   // 2024-2025 data preserved, not deleted
   ```

### Data Preservation

- ✅ Old data remains in database
- ✅ No data is deleted or modified
- ✅ Switching back restores exact historical state
- ✅ Each academic year is a complete isolated workspace

---

## 🛡️ Security Validations

### 1. Tenant Isolation Validation

```typescript
function validateTenantIsolation(ctx: RequestContext): void {
  if (!ctx.school_id) {
    throw new SecurityViolationError("MISSING_TENANT");
  }
  
  if (process.env.NODE_ENV === "production" && 
      ctx.school_id === "dev-school-id") {
    throw new SecurityViolationError("INVALID_TENANT");
  }
}
```

### 2. Academic Year Validation

```typescript
function validateAcademicYearIsolation(ctx: RequestContext): void {
  if (!ctx.active_academic_year_id) {
    throw new SecurityViolationError("MISSING_ACADEMIC_YEAR");
  }
}
```

### 3. Query Parameter Validation

```typescript
function validateQueryParameters(
  ctx: RequestContext, 
  params: Record<string, unknown>
): void {
  // Prevent school_id tampering
  if (params.school_id && params.school_id !== ctx.school_id) {
    throw new SecurityViolationError("CROSS_TENANT_ATTEMPT");
  }
  
  // Prevent academic_year_id tampering
  if (params.academic_year_id && 
      params.academic_year_id !== ctx.active_academic_year_id) {
    throw new SecurityViolationError("CROSS_ACADEMIC_YEAR_ATTEMPT");
  }
}
```

### 4. Output Sanitization

```typescript
function sanitizeOutput<T>(data: T, ctx: RequestContext): T {
  // Remove sensitive fields
  delete data.password_hash;
  
  // Verify school_id matches (prevent data leakage)
  if (data.school_id !== ctx.school_id) {
    throw new SecurityViolationError("DATA_LEAKAGE_PREVENTED");
  }
  
  return data;
}
```

---

## 🚨 Attack Prevention

### 1. Cross-Tenant Access
**Attack:** User from School A tries to access School B data

**Prevention:**
- JWT contains school_id
- All queries filtered by school_id
- Mismatched school_id throws error
- No data returned

### 2. Academic Year Tampering
**Attack:** User tries to access different academic year data

**Prevention:**
- JWT contains active_academic_year_id
- Queries automatically filtered
- Manual override requires admin role
- Audit log created

### 3. URL Parameter Injection
**Attack:** `GET /api/students?school_id=other_school`

**Prevention:**
- Query parameters validated against JWT context
- Mismatched school_id rejected
- Error logged for security audit

### 4. JWT Token Theft
**Attack:** Stolen token used from different IP

**Prevention:**
- HttpOnly cookies (XSS protection)
- SameSite=Lax (CSRF protection)
- Short expiration (8 hours)
- IP and user-agent logged
- Session invalidation on logout

### 5. Role Escalation
**Attack:** Teacher tries to access admin endpoints

**Prevention:**
- RBAC matrix enforced
- Role from JWT (not client)
- Permission checks at service layer
- Audit logs for denied access

---

## 📊 Data Flow Example

### Scenario: Teacher marks attendance

```
1. Teacher logs in
   ↓
2. JWT issued with:
   - school_id: "sch_abc123"
   - role: "teacher"
   - active_academic_year_id: "ay_2024_2025"
   ↓
3. Teacher navigates to attendance page
   ↓
4. Frontend calls: POST /api/attendance
   ↓
5. API extracts context from JWT
   ↓
6. Service layer creates attendance:
   {
     school_id: "sch_abc123",  // From JWT
     academic_year_id: "ay_2024_2025",  // From JWT
     student_id: "...",
     date: "2024-03-15",
     status: "present"
   }
   ↓
7. Database saves with compound index:
   (school_id, academic_year_id, student_id, date)
   ↓
8. Query to fetch attendance automatically filtered:
   WHERE school_id = "sch_abc123" 
   AND academic_year_id = "ay_2024_2025"
```

**Result:** Teacher can ONLY see/modify attendance for:
- Their school
- Current academic year
- Their assigned classes (additional RBAC filter)

---

## 🔍 Audit & Monitoring

### Audit Log Structure

```typescript
{
  timestamp: "2024-03-15T10:30:00Z",
  user_id: "user_123",
  school_id: "sch_abc123",
  academic_year_id: "ay_2024_2025",
  action: "create",
  entity_type: "attendance",
  entity_id: "att_456",
  ip: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  before: null,
  after: { /* new record */ }
}
```

### Security Events Logged

- ✅ Login/logout
- ✅ Academic year switches
- ✅ Failed authentication attempts
- ✅ Permission denied errors
- ✅ Cross-tenant access attempts
- ✅ Data creation/modification/deletion

---

## 🚀 Migration Guide

### Step 1: Add academic_year_id to existing records

```bash
npx ts-node shared/scripts/migrate-academic-year-fields.ts
```

This script:
- Finds all records without academic_year_id
- Assigns active academic year to each
- Preserves existing data
- Reports migration statistics

### Step 2: Update API calls

**Before:**
```typescript
const attendance = await AttendanceModel.find({ 
  school_id: ctx.school_id 
});
```

**After:**
```typescript
const attendance = await AttendanceModel.find(
  academicYearFilter(ctx, {})
);
```

### Step 3: Update frontend

**Add academic year selector:**
```typescript
<AcademicYearSelector 
  onSwitch={(yearId) => switchAcademicYear(yearId)} 
/>
```

---

## ✅ Security Checklist

### Database Layer
- [x] All entities have school_id
- [x] Temporal entities have academic_year_id
- [x] Compound indexes created
- [x] Fields marked as immutable
- [x] Unique constraints include tenant scope

### Authentication Layer
- [x] JWT includes school_id
- [x] JWT includes active_academic_year_id
- [x] JWT includes role and permissions
- [x] HttpOnly cookies used
- [x] Short token expiration

### Service Layer
- [x] All queries use tenantFilter or academicYearFilter
- [x] No raw queries without filtering
- [x] RBAC checks enforced
- [x] Audit logs written

### API Layer
- [x] All routes authenticate requests
- [x] Context extracted from JWT
- [x] Query parameters validated
- [x] Output sanitized
- [x] Errors don't leak data

### Frontend Layer
- [x] Academic year selector implemented
- [x] No client-side tenant filtering
- [x] Tokens stored securely
- [x] Logout clears session

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `shared/models/base.ts` | Tenant field definition |
| `shared/db/tenant-query.ts` | Query filtering helpers |
| `shared/auth/jwt.ts` | JWT token management |
| `shared/auth/middleware.ts` | Authentication middleware |
| `shared/middleware/security-audit.ts` | Security validation |
| `school-app/app/api/academic-years/switch/route.ts` | Year switching endpoint |
| `shared/scripts/migrate-academic-year-fields.ts` | Migration script |

---

## 🎓 Best Practices

### DO ✅
- Always use `tenantFilter` or `academicYearFilter`
- Extract context from JWT, never from request body
- Log security events
- Validate query parameters
- Sanitize output
- Use compound indexes
- Test cross-tenant isolation

### DON'T ❌
- Trust frontend filtering
- Allow client to specify school_id
- Skip authentication checks
- Use raw queries without filtering
- Expose internal IDs in URLs
- Allow cross-tenant queries
- Forget to add academic_year_id to new temporal entities

---

## 🔬 Testing Security

### Test 1: Cross-Tenant Access
```typescript
// Login as School A user
const tokenA = loginAsSchoolA();

// Try to access School B data
const response = await fetch('/api/students?school_id=school_b', {
  headers: { Authorization: `Bearer ${tokenA}` }
});

// Expected: 403 Forbidden
expect(response.status).toBe(403);
```

### Test 2: Academic Year Isolation
```typescript
// Switch to 2023-2024
await switchAcademicYear('ay_2023_2024');

// Create attendance
await createAttendance({ date: '2024-01-15' });

// Switch to 2024-2025
await switchAcademicYear('ay_2024_2025');

// Query attendance
const attendance = await getAttendance();

// Expected: Empty (2024-2025 has no data yet)
expect(attendance).toHaveLength(0);

// Switch back to 2023-2024
await switchAcademicYear('ay_2023_2024');

// Query attendance
const oldAttendance = await getAttendance();

// Expected: Previous data restored
expect(oldAttendance).toHaveLength(1);
```

---

## 📞 Support

For security concerns or questions:
- Review this document
- Check audit logs
- Test in development environment
- Contact security team

---

**Last Updated:** 2024-03-15  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
