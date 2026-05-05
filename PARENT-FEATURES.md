# Parent Features

**Endpoint Prefix:** `/api/parent/*`
**Role:** Parent/Guardian

Parents can monitor one or more linked children through a read-only portal.

## What Parents Can View

- Dashboard overview for all linked children
- Student profiles and academic years
- Results, grades, and performance charts
- Attendance history and trend summaries
- Fee status, due amounts, and payment history
- Homework and assignments
- Announcements and notifications

## Endpoint Groups

### Dashboard and Overview
- `GET /api/parent/dashboard/stats`

Shows total children, per-child summary, pending fees, pending assignments, and alerts.

### Student Profiles
- `GET /api/parent/student-info`
- `GET /api/parent/child/profile`
- `GET /api/parent/academic-years`

Supports listing all linked students and viewing one child in detail.

### Academic Results
- `GET /api/parent/student-results`
- `GET /api/parent/child/results`
- `GET /api/parent/grades`
- `GET /api/parent/child/performance/chart`

Shows exam results, grade summary, ranking, and performance trend.

### Attendance
- `GET /api/parent/student-attendance`
- `GET /api/parent/attendance`
- `GET /api/parent/child/attendance`

Includes summary, month-wise breakdown, and recent attendance.

### Fees and Payments
- `GET /api/parent/fees`
- `GET /api/parent/child/fees`
- `GET /api/parent/child/payments`

Includes fee summary, fee details, payment history, and due notices.

### Homework and Assignments
- `GET /api/parent/child/homework`
- `GET /api/parent/assignments`

Shows current homework, submission state, and overdue work.

### Announcements
- `GET /api/parent/child/announcements`

Displays school notices relevant to the child.

## Multiple Children Flow

1. Open dashboard.
2. Review each child's summary.
3. Switch between children for detailed views.
4. Use fees, attendance, and results pages for deeper monitoring.

## Permissions

- View only.
- Can only access linked children.
- Cannot modify grades, attendance, fees, or profile data.

## Notes

- All views are tenant-scoped.
- Parent data is aggregated from child-specific records.
