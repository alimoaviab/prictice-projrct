# Teacher Full Role Flow

**Endpoint Prefix:** `/api/teacher/*`
**Key Role:** Teacher

This guide describes the daily operating flow for teachers.

## 1. Login and Dashboard

1. Sign in with school credentials.
2. Open `GET /api/teacher/dashboard/stats`.
3. Review assigned classes, pending attendance, and exam work.

## 2. Assigned Classes and Students

1. Open `GET /api/teacher/my-classes`.
2. Open `GET /api/teacher/classes/:classId/students`.
3. Review class membership and subject assignments.

## 3. Attendance Flow

1. Open `GET /api/teacher/attendance/summary`.
2. Load a class roster with `GET /api/teacher/attendance`.
3. Submit daily attendance with `POST /api/teacher/attendance/mark`.
4. Recheck attendance history if needed.

## 4. Marks Entry Flow

1. Open `GET /api/teacher/exams`.
2. Select the active exam.
3. Use `GET /api/teacher/exams/:id/marks/grid` for bulk entry.
4. Save marks with `POST /api/teacher/exams/:id/marks/grid` or `POST /api/teacher/exams/:id/marks`.
5. Check completion with `GET /api/teacher/exams/:id/marks-status`.

## 5. Homework Flow

1. Review class routine and schedules.
2. Create homework with `POST /api/teacher/homework`.
3. Monitor submissions with `GET /api/teacher/homework/:id`.

## 6. Weekly and Monthly Routine

- Mark attendance every working day.
- Enter marks when exams are scheduled.
- Review homework and class status.
- Check student progress before parent communication.

## Permissions

- Teachers can only work with assigned classes and subjects.
- Fee operations are view-only.
- Result publication is controlled by exam permissions.

## Notes

- Keep attendance and marks entry consistent.
- Review dashboard stats before closing the day.
