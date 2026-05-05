# SchoolCentral Documentation Index

Complete API and feature documentation for the SchoolCentral school management system.

## Documentation Files

### Role-Based Guides

- [ADMIN-FEATURES.md](ADMIN-FEATURES.md) - school administration, setup, and operations
- [TEACHER-FEATURES.md](TEACHER-FEATURES.md) - teacher workflow and classroom operations
- [STUDENT-FEATURES.md](STUDENT-FEATURES.md) - student-facing read-only portal views
- [TEACHER-FLOW.md](TEACHER-FLOW.md) - teacher daily operating flow
- [STUDENT-FLOW.md](STUDENT-FLOW.md) - student portal usage flow
- [PARENT-FEATURES.md](PARENT-FEATURES.md) - parent and guardian monitoring portal

### Feature Guides

- [ATTENDANCE-FLOW.md](ATTENDANCE-FLOW.md) - attendance marking, viewing, and reporting
- [FEES-FLOW.md](FEES-FLOW.md) - fee setup, generation, payments, and analytics
- [EXAMS-RESULTS-FLOW.md](EXAMS-RESULTS-FLOW.md) - exam lifecycle, marks, and results
- [CLASSES-ACADEMIC-STRUCTURE.md](CLASSES-ACADEMIC-STRUCTURE.md) - academic years, classes, subjects, and enrollments

## Quick Start by Role

### School Admin
1. Start with [ADMIN-FEATURES.md](ADMIN-FEATURES.md)
2. Review [CLASSES-ACADEMIC-STRUCTURE.md](CLASSES-ACADEMIC-STRUCTURE.md)
3. Configure fees with [FEES-FLOW.md](FEES-FLOW.md)
4. Create exams using [EXAMS-RESULTS-FLOW.md](EXAMS-RESULTS-FLOW.md)
5. Mark attendance with [ATTENDANCE-FLOW.md](ATTENDANCE-FLOW.md)

### Teacher
1. Start with [TEACHER-FEATURES.md](TEACHER-FEATURES.md)
2. Review [TEACHER-FLOW.md](TEACHER-FLOW.md)
3. Use [ATTENDANCE-FLOW.md](ATTENDANCE-FLOW.md) for roster marking
4. Use [EXAMS-RESULTS-FLOW.md](EXAMS-RESULTS-FLOW.md) for marks entry

### Parent
1. Start with [PARENT-FEATURES.md](PARENT-FEATURES.md)
2. Review [STUDENT-FEATURES.md](STUDENT-FEATURES.md)
3. Check [FEES-FLOW.md](FEES-FLOW.md) for payment status
4. Monitor [ATTENDANCE-FLOW.md](ATTENDANCE-FLOW.md) for attendance history

### Student
1. Read [STUDENT-FEATURES.md](STUDENT-FEATURES.md)
2. Follow [STUDENT-FLOW.md](STUDENT-FLOW.md)
3. View results in [EXAMS-RESULTS-FLOW.md](EXAMS-RESULTS-FLOW.md)

## API Surface

- `/api/school/*` - admin and school operations
- `/api/teacher/*` - teacher operations and read-only class views
- `/api/parent/*` - parent and student portal views

## Platform Rules

- All requests are tenant-scoped to a single school.
- JWT authentication is required.
- RBAC controls access by role and feature.
- Parents can only view linked children.
- Teachers can only access assigned classes and subjects.

## Documentation Map

- Setup and structure: [CLASSES-ACADEMIC-STRUCTURE.md](CLASSES-ACADEMIC-STRUCTURE.md)
- Attendance: [ATTENDANCE-FLOW.md](ATTENDANCE-FLOW.md)
- Fees: [FEES-FLOW.md](FEES-FLOW.md)
- Exams and results: [EXAMS-RESULTS-FLOW.md](EXAMS-RESULTS-FLOW.md)

**Last Updated:** May 6, 2026
