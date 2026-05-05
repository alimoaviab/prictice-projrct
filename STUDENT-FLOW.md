# Student Full Role Flow

**Access Path:** `/api/parent/*` via parent portal
**Key Role:** Student, read-only

This guide describes how a student views school information through the parent portal.

## 1. Login and Portal Entry

1. Parent signs in.
2. Open the child profile and dashboard.
3. Select the active child if multiple children are linked.

## 2. Profile and Academic Info

- `GET /api/parent/student-info`
- `GET /api/parent/child/profile`
- `GET /api/parent/academic-years`

## 3. Results Viewing Flow

- `GET /api/parent/student-results`
- `GET /api/parent/child/results`
- `GET /api/parent/grades`

Review subject-wise marks, grades, total percentage, class average, and position.

## 4. Attendance Viewing Flow

- `GET /api/parent/student-attendance`
- `GET /api/parent/attendance`
- `GET /api/parent/child/attendance`

Review summary, month-wise breakdown, recent records, and trend status.

## 5. Fees and Homework Flow

- `GET /api/parent/fees`
- `GET /api/parent/child/fees`
- `GET /api/parent/child/payments`
- `GET /api/parent/child/homework`
- `GET /api/parent/assignments`

## 6. Announcements and Daily Review

- `GET /api/parent/child/announcements`
- `GET /api/parent/dashboard/stats`
- `GET /api/parent/child/performance/chart`

## Notes

- Students see read-only data.
- All information is tenant-scoped.
- Access is restricted to linked children only.
