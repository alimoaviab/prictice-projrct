# Student Features

**Access Path:** `/api/parent/*` through the parent portal
**Key Role:** Student, read-only

## What Students Can View

- Profile and enrollment information
- Results and grades
- Attendance history
- Fee status and payment history
- Homework and assignments
- Performance analytics
- Announcements
- Dashboard overview

## Core Endpoints

- `GET /api/parent/dashboard/stats`
- `GET /api/parent/student-info`
- `GET /api/parent/student-results`
- `GET /api/parent/grades`
- `GET /api/parent/student-attendance`
- `GET /api/parent/fees`
- `GET /api/parent/child/homework`
- `GET /api/parent/child/performance/chart`
- `GET /api/parent/child/announcements`

## Response Highlights

### Student Info
- Name, roll number, class, section, and academic year
- Guardian contact details
- Enrolled subjects

### Results
- Exam name and date
- Subject-wise marks and grades
- Position and class comparison
- Overall grade and percentage

### Attendance
- Summary of present, absent, and late days
- Month-wise breakdown
- Recent attendance records
- Trend analysis and alert messaging

### Fees
- Total fee, collected amount, and pending amount
- Fee details per fee type
- Payment history and receipts
- Due notices

### Homework
- Assignment title and subject
- Due date and submission status
- Supporting attachments

## Access Rules

- Students can only view their own data.
- All requests are tenant-scoped.
- No write operations are exposed through the student portal.

## Typical Flow

1. Open the parent portal.
2. Select the student.
3. Check results, attendance, fees, and homework.
4. Review announcements and performance chart.
