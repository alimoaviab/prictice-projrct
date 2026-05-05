# Teacher Features

**Endpoint Prefix:** `/api/teacher/*`

Teachers can manage assigned classes, mark attendance, enter exam marks, and view their dashboard.

## Key Areas

### Dashboard
- `GET /api/teacher/dashboard/stats`

### My Classes and Students
- `GET /api/teacher/my-classes`
- `GET /api/teacher/classes/:classId/students`
- `GET /api/teacher/teachers/:id/classes`
- `GET /api/teacher/classes/:classId/subjects`

### Attendance
- `GET /api/teacher/attendance`
- `POST /api/teacher/attendance/mark`
- `GET /api/teacher/attendance/summary`

### Exams and Marks
- `GET /api/teacher/exams`
- `POST /api/teacher/exams`
- `GET /api/teacher/exams/:id`
- `PATCH /api/teacher/exams/:id`
- `DELETE /api/teacher/exams/:id`
- `PUT /api/teacher/exams/:id/schedule`
- `GET /api/teacher/exams/:id/marks`
- `POST /api/teacher/exams/:id/marks`
- `GET /api/teacher/exams/:id/marks/grid`
- `POST /api/teacher/exams/:id/marks/grid`
- `GET /api/teacher/exams/:id/marks-status`
- `GET /api/teacher/exams/:id/results`
- `GET /api/teacher/exams/:id/result/:student_id`
- `POST /api/teacher/exams/:id/publish`
- `POST /api/teacher/exams/:id/publish-results`
- `POST /api/teacher/exams/:id/unpublish-results`

### Homework
- `GET /api/teacher/homework`
- `POST /api/teacher/homework`
- `GET /api/teacher/homework/:id`
- `PATCH /api/teacher/homework/:id`
- `DELETE /api/teacher/homework/:id`

### Fees (Read Only)
- `GET /api/teacher/fees`
- `GET /api/teacher/fees/types`
- `GET /api/teacher/fees/classes/:class_id`
- `GET /api/teacher/fees/monthly`
- `GET /api/teacher/fees/summary`
- `GET /api/teacher/fees/analytics`
- `GET /api/teacher/fees/defaulters`
- `GET /api/teacher/fees/breakdown`
- `GET /api/teacher/fees/payments`
- `GET /api/teacher/fees/payments/daily`
- `GET /api/teacher/fees/payments/receipt/:receipt_no`
- `GET /api/teacher/fees/adjustments`

## Permissions

Teachers can only access assigned classes and related student data.

## Typical Daily Flow

1. Open the dashboard.
2. Review assigned classes.
3. Mark attendance.
4. Enter marks for scheduled exams.
5. Check completion status and homework.

## Notes

- Teachers have read-only fee access.
- Teachers cannot modify school-wide settings.
- Class and exam access is restricted to assigned records.
