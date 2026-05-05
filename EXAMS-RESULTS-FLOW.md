# Exams and Results Flow

**Endpoints:** `/api/school/*`, `/api/teacher/*`, `/api/parent/*`

## Overview

Exam management covers creation, scheduling, marks entry, publishing, and result viewing.

## Key Flow

1. Create exam.
2. Set schedule.
3. Enter marks.
4. Publish results.
5. View results.

## Admin Endpoints

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

## Teacher Endpoints

- `GET /api/teacher/exams`
- `POST /api/teacher/exams`
- `GET /api/teacher/exams/:id/marks`
- `POST /api/teacher/exams/:id/marks`
- `GET /api/teacher/exams/:id/marks/grid`
- `POST /api/teacher/exams/:id/marks/grid`
- `GET /api/teacher/exams/:id/marks-status`
- `GET /api/teacher/exams/:id/results`
- `GET /api/teacher/exams/:id/result/:student_id`

## Parent and Student Views

- `GET /api/parent/student-results`
- `GET /api/parent/child/results`
- `GET /api/parent/grades`
- `GET /api/parent/child/performance/chart`

## Validation Rules

- Marks cannot exceed the total marks.
- Exam schedule must exist before publishing results.
- All students in the class must have marks before result publication.
- Grades are derived from percentage and class thresholds.

## Reporting

- Result cards
- Class result lists
- Marks completion status
- Performance trends
- Ranking and class averages

## Security Notes

- Exam records are tenant-scoped.
- Teachers only work with assigned classes.
- Parents can only view linked child results.
