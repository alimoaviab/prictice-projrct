# Classes and Academic Structure

**Endpoints:** `/api/school/*`, `/api/teacher/*`, `/api/parent/*`

## Core Concepts

- One active academic year at a time.
- Classes belong to an academic year.
- Subjects can be assigned to classes and teachers.
- Students enroll into a class within the active academic year.
- Parents see only linked students.

## Admin Endpoints

- `GET /api/school/academic-years`
- `POST /api/school/academic-years`
- `GET /api/school/academic-years/current`
- `GET /api/school/academic-years/:id`
- `PATCH /api/school/academic-years/:id`
- `DELETE /api/school/academic-years/:id`
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
- `GET /api/school/subjects`
- `POST /api/school/subjects`
- `GET /api/school/subjects/:id`
- `PUT /api/school/subjects/:id`
- `DELETE /api/school/subjects/:id`
- `GET /api/school/subjects/class/:class_id`
- `GET /api/school/teachers/:id/classes`
- `GET /api/school/teachers/:id/subjects`

## Teacher Views

- `GET /api/teacher/my-classes`
- `GET /api/teacher/classes/:classId/students`
- `GET /api/teacher/classes/:classId/subjects`

## Parent and Student Views

- `GET /api/parent/student-info`
- `GET /api/parent/academic-years`

## Validation Rules

- A class cannot be deleted if students are enrolled.
- Only one active academic year should exist.
- Subject and teacher assignments must stay tenant-scoped.
- Grade thresholds must be ordered and non-overlapping.

## Common Flow

1. Create an academic year.
2. Create classes and sections.
3. Add subjects.
4. Assign teachers.
5. Enroll students.
6. Configure grade thresholds.
7. Link fees, attendance, and exams to the class structure.

## Notes

- Structure decisions here affect attendance, fees, and results.
- Keep class names and sections consistent across modules.
