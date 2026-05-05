# Admin Features

**Endpoint Prefix:** `/api/school/*`
**Key Role:** School Admin Only

School admins control the full system setup, operational configuration, and reporting layer.

## What Admins Manage

- Academic years and activation
- Classes, sections, subjects, and grade thresholds
- Students, teachers, and guardian links
- Attendance setup and review
- Fee configuration, generation, and collection
- Exams, schedules, marks, and result publication
- Announcements, settings, reports, and school profile

## Endpoint Groups

### Academic Years
- `GET /api/school/academic-years`
- `POST /api/school/academic-years`
- `GET /api/school/academic-years/current`
- `GET /api/school/academic-years/:id`
- `PATCH /api/school/academic-years/:id`
- `DELETE /api/school/academic-years/:id`

### Classes and Structure
- `GET /api/school/classes`
- `POST /api/school/classes`
- `GET /api/school/classes/:id`
- `PATCH /api/school/classes/:id`
- `DELETE /api/school/classes/:id`
- `GET /api/school/classes/check`
- `GET /api/school/classes/:id/students`
- `GET /api/school/classes/:id/subjects`
- `POST /api/school/classes/:id/subjects`
- `DELETE /api/school/classes/:id/subjects/:subject_id`
- `POST /api/school/classes/:id/grades`

### Students and Guardians
- `GET /api/school/students`
- `POST /api/school/students`
- `GET /api/school/students/:id`
- `PATCH /api/school/students/:id`
- `DELETE /api/school/students/:id`
- `GET /api/school/guardians`
- `GET /api/school/guardians/:id`
- `POST /api/school/guardians/link`

### Teachers and Assignments
- `GET /api/school/teachers`
- `POST /api/school/teachers`
- `GET /api/school/teachers/:id`
- `PATCH /api/school/teachers/:id`
- `DELETE /api/school/teachers/:id`
- `GET /api/school/teachers/:id/classes`
- `GET /api/school/teachers/:id/subjects`

### Subjects
- `GET /api/school/subjects`
- `POST /api/school/subjects`
- `GET /api/school/subjects/:id`
- `PUT /api/school/subjects/:id`
- `DELETE /api/school/subjects/:id`
- `GET /api/school/subjects/class/:class_id`

### Attendance
- `GET /api/school/attendance`
- `POST /api/school/attendance/mark`
- `GET /api/school/attendance/summary`

### Fees
- `GET /api/school/fees/types`
- `POST /api/school/fees/types`
- `GET /api/school/fees/classes/:class_id`
- `POST /api/school/fees/classes/:class_id`
- `POST /api/school/fees/classes/:class_id/add`
- `PUT /api/school/fees/classes/:class_id/:fee_id`
- `DELETE /api/school/fees/classes/:class_id/:fee_id`
- `POST /api/school/fees/check-duplicates`
- `POST /api/school/fees/generate`
- `GET /api/school/fees`
- `GET /api/school/fees/monthly`
- `GET /api/school/fees/summary`
- `GET /api/school/fees/analytics`
- `GET /api/school/fees/defaulters`
- `GET /api/school/fees/breakdown`
- `GET /api/school/fees/payments`
- `POST /api/school/fees/payments`
- `POST /api/school/fees/payments/bulk`
- `GET /api/school/fees/payments/daily`
- `GET /api/school/fees/payments/receipt/:receipt_no`
- `GET /api/school/fees/adjustments`
- `POST /api/school/fees/adjustments`
- `PUT /api/school/fees/adjustments/:adjustment_id`
- `DELETE /api/school/fees/adjustments/:adjustment_id`

### Exams and Results
- `GET /api/school/exams`
- `POST /api/school/exams`
- `GET /api/school/exams/:id`
- `PATCH /api/school/exams/:id`
- `DELETE /api/school/exams/:id`
- `PUT /api/school/exams/:id/schedule`
- `GET /api/school/exams/calendar`
- `GET /api/school/exams/schedule/class/:class_id`
- `GET /api/school/exams/:id/marks`
- `POST /api/school/exams/:id/marks`
- `GET /api/school/exams/:id/marks/grid`
- `POST /api/school/exams/:id/marks/grid`
- `GET /api/school/exams/:id/marks-status`
- `POST /api/school/exams/:id/publish`
- `POST /api/school/exams/:id/publish-results`
- `POST /api/school/exams/:id/unpublish-results`
- `GET /api/school/exams/:id/results`
- `GET /api/school/exams/:id/result/:student_id`

### Reporting and Settings
- `GET /api/school/dashboard/stats`
- `GET /api/school/reports/*`
- `GET /api/school/settings/*`
- `GET /api/school/announcements`

## Admin Workflow

1. Create an academic year and activate it.
2. Create classes, subjects, and grade thresholds.
3. Add students, guardians, and teachers.
4. Configure class fees and monthly fee rules.
5. Create exams and set schedules.
6. Mark or review attendance.
7. Generate monthly fees and record payments.
8. Enter marks, publish results, and send reports.

## Permissions

Admins have full access to school-scoped data. All actions remain tenant-isolated.

## Validation Rules

- Only one academic year should be active at a time.
- Fee generation should check duplicates first.
- Result publication requires complete marks.
- Class deletion is blocked when students are enrolled.

## Notes

- Admins own configuration and reporting.
- Teachers and parents consume the data created here.
