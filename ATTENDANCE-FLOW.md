# Attendance Flow

**Endpoints:** `/api/school/*`, `/api/teacher/*`, `/api/parent/*`

## Overview

Attendance is recorded as one row per student per day with a status of `present`, `absent`, `late`, or `excused`.

## API Endpoints

### Admin
- `POST /api/school/attendance/mark`
- `GET /api/school/attendance`
- `GET /api/school/attendance/summary`

### Teacher
- `POST /api/teacher/attendance/mark`
- `GET /api/teacher/attendance`
- `GET /api/teacher/attendance/summary`

### Parent
- `GET /api/parent/student-attendance`
- `GET /api/parent/attendance`
- `GET /api/parent/child/attendance`

## Step-by-Step Flow

1. Select the school, class, and date.
2. Load the student roster for that class.
3. Mark each student with a valid attendance status.
4. Save the roster in one request.
5. Review the summary and daily report.

## Validations

- One attendance record per student per day.
- Status must be one of the supported values.
- Attendance is tenant-scoped to the school.
- Teachers can only mark assigned classes.

## Reporting

Attendance reports include:
- Total working days
- Present, absent, late, and excused counts
- Month-wise breakdown
- Recent records
- Trend and alert text

## Security Notes

- Attendance data is school-isolated.
- Parents see only linked children.
- Teachers and admins cannot cross tenant boundaries.
