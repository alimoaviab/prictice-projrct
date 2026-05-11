# 🚀 Multi-Tenant Security - Quick Reference

## 📋 TL;DR

**What changed:** Added complete academic year isolation to prevent data mixing between school years.

**Impact:** Every query automatically filtered by school AND academic year. Historical data preserved forever.

**Action required:** Run migration script, test, deploy.

---

## 🔧 Quick Usage Guide

### 1. Service Layer - Use the Right Filter

**For temporal entities** (attendance, exams, results, homework, timetable, fees):
```typescript
import { academicYearFilter } from "@edu/shared/db/tenant-query";

const attendance = await AttendanceModel.find(
  academicYearFilter(ctx, { date: today })
);
```

**For non-temporal entities** (students, teachers, users):
```typescript
import { tenantFilter } from "@edu/shared/db/tenant-query";

const students = await StudentModel.find(
  tenantFilter(ctx, { status: "active" })
);
```

### 2. API Layer - Standard Pattern

```typescript
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { auditRequest } from "@edu/shared/middleware/security-audit";

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const ctx = authenticateRequest(sessionRequest(request), "school");
  
  // 2. Audit (optional)
  auditRequest(ctx, { 
    requireAcademicYear: true,
    allowedRoles: ["admin", "teacher"]
  });
  
  // 3. Call service
  const result = await yourService(ctx);
  
  // 4. Return
  return NextResponse.json(result);
}
```

### 3. Frontend - Year Switching

```typescript
async function switchAcademicYear(yearId: string) {
  const response = await fetch('/api/academic-years/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ academic_year_id: yearId })
  });
  
  if (response.ok) {
    const data = await response.json();
    // Update auth token
    setAuthToken(data.data.token);
    // Reload data
    window.location.reload();
  }
}
```

---

## 📊 Which Entities Need Academic Year?

### ✅ YES - Temporal (changes each year)
- Attendance
- Exams
- Results
- Homework
- Timetables
- Fees
- Classes (linked to academic year)

### ❌ NO - Persistent (stays across years)
- Users
- Teachers
- Students
- Schools
- Academic Years themselves

---

## 🔍 Quick Debugging

### Check JWT Token
```typescript
// Decode JWT to verify it has academic_year_id
const decoded = jwt.decode(token);
console.log(decoded.active_academic_year_id); // Should exist
```

### Check Query Filtering
```typescript
// Before query
console.log("Context:", ctx.school_id, ctx.active_academic_year_id);

// Build filter
const filter = academicYearFilter(ctx, {});
console.log("Filter:", filter);
// Should include both school_id and academic_year_id
```

### Check Database Records
```javascript
// In MongoDB shell
db.attendance.findOne()
// Should have both school_id and academic_year_id fields
```

---

## 🚨 Common Mistakes

### ❌ DON'T
```typescript
// DON'T use raw queries
const data = await Model.find({ school_id: ctx.school_id });

// DON'T trust client input
const schoolId = request.body.school_id; // NEVER

// DON'T skip authentication
export async function GET(request: NextRequest) {
  const data = await Model.find({}); // WRONG
}
```

### ✅ DO
```typescript
// DO use filter helpers
const data = await Model.find(
  academicYearFilter(ctx, {})
);

// DO extract from JWT
const ctx = authenticateRequest(request, "school");
const schoolId = ctx.school_id; // CORRECT

// DO authenticate every request
export async function GET(request: NextRequest) {
  const ctx = authenticateRequest(sessionRequest(request), "school");
  const data = await yourService(ctx);
}
```

---

## 🧪 Quick Test

```typescript
// Test 1: Create data in current year
await createAttendance({ date: "2024-03-15" });

// Test 2: Switch to different year
await switchAcademicYear("old_year_id");

// Test 3: Query data
const attendance = await getAttendance();

// Expected: Empty (different year)
expect(attendance).toHaveLength(0);

// Test 4: Switch back
await switchAcademicYear("current_year_id");

// Test 5: Query again
const attendanceAgain = await getAttendance();

// Expected: Original data restored
expect(attendanceAgain).toHaveLength(1);
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `shared/db/tenant-query.ts` | Filter helpers |
| `shared/auth/jwt.ts` | JWT with academic year |
| `shared/auth/middleware.ts` | Authentication |
| `shared/middleware/security-audit.ts` | Security validation |
| `school-app/app/api/academic-years/switch/route.ts` | Year switching |
| `shared/scripts/migrate-academic-year-fields.ts` | Migration |

---

## 🚀 Deployment Checklist

- [ ] Review code changes
- [ ] Test locally
- [ ] Deploy to staging
- [ ] Run migration on staging
- [ ] Test year switching
- [ ] Deploy to production
- [ ] Run migration on production
- [ ] Monitor logs
- [ ] Verify security

---

## 💡 Pro Tips

1. **Always use filter helpers** - Never write raw queries
2. **Test year switching** - Verify data isolation works
3. **Check JWT payload** - Ensure academic_year_id is present
4. **Monitor audit logs** - Watch for security violations
5. **Run migration once** - Don't run multiple times

---

## 🆘 Troubleshooting

### Problem: "MISSING_ACADEMIC_YEAR" error
**Solution:** User needs to log in again to get new JWT with academic_year_id

### Problem: No data showing after year switch
**Solution:** This is correct! Different year = different data. Switch back to see old data.

### Problem: Migration script fails
**Solution:** Check that active academic year exists for each school

### Problem: Cross-tenant access error
**Solution:** This is security working correctly. User trying to access wrong school's data.

---

## 📞 Need Help?

1. Read `docs/MULTI_TENANT_SECURITY_ARCHITECTURE.md` for deep dive
2. Read `docs/IMPLEMENTATION_SUMMARY.md` for overview
3. Check audit logs for security events
4. Test in development environment first

---

**Last Updated:** 2024-03-15  
**Version:** 1.0.0  
**Status:** Production Ready ✅
