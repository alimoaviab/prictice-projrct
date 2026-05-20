package persistence

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5"
)

// upsertRow dispatches a typed UPSERT for the given table. New tables
// require one new case here — that is the only file that changes when
// adding a domain to persistence.
func upsertRow(ctx context.Context, tx pgx.Tx, table string, doc any) error {
	switch v := doc.(type) {
	case *store.School:
		return upsertSchool(ctx, tx, v)
	case *store.User:
		return upsertUser(ctx, tx, v)
	case *store.AcademicYear:
		return upsertAcademicYear(ctx, tx, v)
	case *store.Subject:
		return upsertSubject(ctx, tx, v)
	case *store.Class:
		return upsertClass(ctx, tx, v)
	case *store.Teacher:
		return upsertTeacher(ctx, tx, v)
	case *store.Student:
		return upsertStudent(ctx, tx, v)
	case *store.Parent:
		return upsertParent(ctx, tx, v)
	case *store.StudentParent:
		return upsertStudentParent(ctx, tx, v)
	case *store.Attendance:
		return upsertAttendance(ctx, tx, v)
	case *store.Exam:
		return upsertExam(ctx, tx, v)
	case *store.Result:
		return upsertResult(ctx, tx, v)
	case *store.Homework:
		return upsertHomework(ctx, tx, v)
	case *store.Announcement:
		return upsertAnnouncement(ctx, tx, v)
	case *store.Behavior:
		return upsertBehavior(ctx, tx, v)
	case *store.Event:
		return upsertEvent(ctx, tx, v)
	case *store.Leave:
		return upsertLeave(ctx, tx, v)
	case *store.Timetable:
		return upsertTimetable(ctx, tx, v)
	case *store.LiveClass:
		return upsertLiveClass(ctx, tx, v)
	case *store.Notification:
		return upsertNotification(ctx, tx, v)
	case *store.FeeType:
		return upsertFeeType(ctx, tx, v)
	case *store.ClassFee:
		return upsertClassFee(ctx, tx, v)
	case *store.Fee:
		return upsertFee(ctx, tx, v)
	case *store.FeeAdjustment:
		return upsertFeeAdjustment(ctx, tx, v)
	case *store.FeePayment:
		return upsertFeePayment(ctx, tx, v)
	case *store.SchoolSettings:
		return upsertSchoolSettings(ctx, tx, v)
	case *store.AuditLog:
		return upsertAuditLog(ctx, tx, v)
	case *store.CertificateTemplate:
		return upsertCertificateTemplate(ctx, tx, v)
	case *store.GeneratedCertificate:
		return upsertGeneratedCertificate(ctx, tx, v)
	}
	return fmt.Errorf("upsert: unknown document type for table %s", table)
}

func deleteRow(ctx context.Context, tx pgx.Tx, table, id string) error {
	if id == "" {
		return errors.New("delete: empty id")
	}
	switch table {
	case "school_settings":
		_, err := tx.Exec(ctx, `DELETE FROM school_settings WHERE school_id=$1`, id)
		return err
	default:
		_, err := tx.Exec(ctx, fmt.Sprintf(`DELETE FROM %s WHERE id=$1`, table), id)
		return err
	}
}

// ─── Per-table UPSERTs ───────────────────────────────────────────────────
//
// Every UPSERT writes the full row using ON CONFLICT (id) DO UPDATE so the
// in-memory state is the authoritative source after a mutation.

func upsertSchool(ctx context.Context, tx pgx.Tx, v *store.School) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO schools (id, school_id, name, code, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (id) DO UPDATE SET
			school_id=EXCLUDED.school_id, name=EXCLUDED.name, code=EXCLUDED.code,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Name, v.Code, v.Status, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertUser(ctx context.Context, tx pgx.Tx, v *store.User) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO users (id, school_id, email, password_hash, role, permissions,
			profile_first, profile_last, profile_phone, profile_avatar,
			status, last_login_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (id) DO UPDATE SET
			email=EXCLUDED.email, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role,
			permissions=EXCLUDED.permissions, profile_first=EXCLUDED.profile_first,
			profile_last=EXCLUDED.profile_last, profile_phone=EXCLUDED.profile_phone,
			profile_avatar=EXCLUDED.profile_avatar, status=EXCLUDED.status,
			last_login_at=EXCLUDED.last_login_at, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Email, v.PasswordHash, v.Role, v.Permissions,
		v.Profile.FirstName, v.Profile.LastName, v.Profile.Phone, v.Profile.AvatarURL,
		v.Status, v.LastLoginAt, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertAcademicYear(ctx context.Context, tx pgx.Tx, v *store.AcademicYear) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO academic_years (id, school_id, year, start_date, end_date, is_active,
			description, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		ON CONFLICT (id) DO UPDATE SET
			year=EXCLUDED.year, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date,
			is_active=EXCLUDED.is_active, description=EXCLUDED.description,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Year, v.StartDate, v.EndDate, v.IsActive,
		v.Description, v.Status, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertSubject(ctx context.Context, tx pgx.Tx, v *store.Subject) error {
	teacherID := nullableString(v.TeacherID)
	_, err := tx.Exec(ctx, `
		INSERT INTO subjects (id, school_id, name, code, description, status, total_marks, passing_marks, teacher_id, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		ON CONFLICT (id) DO UPDATE SET
			name=EXCLUDED.name, code=EXCLUDED.code, description=EXCLUDED.description,
			status=EXCLUDED.status, total_marks=EXCLUDED.total_marks,
			passing_marks=EXCLUDED.passing_marks, teacher_id=EXCLUDED.teacher_id
	`, v.ID, v.SchoolID, v.Name, v.Code, v.Description, v.Status, v.TotalMarks, v.PassingMarks, teacherID, v.CreatedAt)
	return err
}

func upsertClass(ctx context.Context, tx pgx.Tx, v *store.Class) error {
	subjects, err := jsonOrArray(v.Subjects)
	if err != nil {
		return err
	}

	classTeacherID := nullableString(v.ClassTeacherID)
	_, err = tx.Exec(ctx, `
		INSERT INTO classes (id, school_id, academic_year_id, name, code, grade, section,
			capacity, display_order, passing_percentage, class_teacher_id,
			room_number, description, subjects, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
		ON CONFLICT (id) DO UPDATE SET
			name=EXCLUDED.name, code=EXCLUDED.code, grade=EXCLUDED.grade,
			section=EXCLUDED.section, capacity=EXCLUDED.capacity,
			display_order=EXCLUDED.display_order, passing_percentage=EXCLUDED.passing_percentage,
			class_teacher_id=EXCLUDED.class_teacher_id, room_number=EXCLUDED.room_number,
			description=EXCLUDED.description, subjects=EXCLUDED.subjects, status=EXCLUDED.status,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.AcademicYearID, v.Name, v.Code, v.Grade, v.Section,
		v.Capacity, v.DisplayOrder, v.PassingPercentage, classTeacherID,
		v.RoomNumber, v.Description, subjects, v.Status, v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	// Replace junctions.
	if _, err := tx.Exec(ctx, `DELETE FROM class_teachers WHERE class_id=$1`, v.ID); err != nil {
		return err
	}
	for _, tid := range v.TeacherIDs {
		if tid == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO class_teachers (class_id, teacher_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
		`, v.ID, tid); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `DELETE FROM class_subjects WHERE class_id=$1`, v.ID); err != nil {
		return err
	}
	for _, sid := range v.SubjectIDs {
		if sid == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO class_subjects (class_id, subject_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
		`, v.ID, sid); err != nil {
			return err
		}
	}
	return nil
}

func upsertTeacher(ctx context.Context, tx pgx.Tx, v *store.Teacher) error {
	yearID := nullableString(v.AcademicYearID)
	userID := nullableString(v.UserID)
	_, err := tx.Exec(ctx, `
		INSERT INTO teachers (id, school_id, academic_year_id, user_id, email, employee_no,
			first_name, last_name, phone, qualification, status, joined_at,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (id) DO UPDATE SET
			academic_year_id=EXCLUDED.academic_year_id, user_id=EXCLUDED.user_id,
			email=EXCLUDED.email, employee_no=EXCLUDED.employee_no,
			first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
			phone=EXCLUDED.phone, qualification=EXCLUDED.qualification,
			status=EXCLUDED.status, joined_at=EXCLUDED.joined_at,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, yearID, userID, v.Email, v.EmployeeNo,
		v.FirstName, v.LastName, v.Phone, v.Qualification, v.Status, v.JoinedAt,
		v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM teacher_subjects WHERE teacher_id=$1`, v.ID); err != nil {
		return err
	}
	for _, sid := range v.SubjectIDs {
		if sid == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
		`, v.ID, sid); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `DELETE FROM teacher_classes WHERE teacher_id=$1`, v.ID); err != nil {
		return err
	}
	for _, cid := range v.ClassIDs {
		if cid == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO teacher_classes (teacher_id, class_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
		`, v.ID, cid); err != nil {
			return err
		}
	}
	return nil
}

func upsertStudent(ctx context.Context, tx pgx.Tx, v *store.Student) error {
	userID := nullableString(v.UserID)
	_, err := tx.Exec(ctx, `
		INSERT INTO students (id, school_id, academic_year_id, user_id, class_id,
			admission_no, first_name, last_name, section, roll_no, date_of_birth, gender,
			guardian_name, guardian_phone, guardian_email, status, enrolled_at,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
		ON CONFLICT (id) DO UPDATE SET
			academic_year_id=EXCLUDED.academic_year_id, user_id=EXCLUDED.user_id,
			class_id=EXCLUDED.class_id, admission_no=EXCLUDED.admission_no,
			first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
			section=EXCLUDED.section, roll_no=EXCLUDED.roll_no,
			date_of_birth=EXCLUDED.date_of_birth, gender=EXCLUDED.gender,
			guardian_name=EXCLUDED.guardian_name, guardian_phone=EXCLUDED.guardian_phone,
			guardian_email=EXCLUDED.guardian_email, status=EXCLUDED.status,
			enrolled_at=EXCLUDED.enrolled_at, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.AcademicYearID, userID, v.ClassID,
		v.AdmissionNo, v.FirstName, v.LastName, v.Section, v.RollNo, v.DateOfBirth, v.Gender,
		v.Guardian.Name, v.Guardian.Phone, v.Guardian.Email,
		v.Status, v.EnrolledAt, v.CreatedAt, v.UpdatedAt)
	if err != nil {
		// If unique constraint on admission_no conflicts, try update by admission_no
		if strings.Contains(err.Error(), "23505") && strings.Contains(err.Error(), "admission") {
			_, err = tx.Exec(ctx, `
				UPDATE students SET
					academic_year_id=$3, user_id=$4, class_id=$5,
					first_name=$7, last_name=$8, section=$9, roll_no=$10,
					date_of_birth=$11, gender=$12, guardian_name=$13, guardian_phone=$14,
					guardian_email=$15, status=$16, enrolled_at=$17, updated_at=$19
				WHERE school_id=$2 AND admission_no=$6
			`, v.ID, v.SchoolID, v.AcademicYearID, userID, v.ClassID,
				v.AdmissionNo, v.FirstName, v.LastName, v.Section, v.RollNo, v.DateOfBirth, v.Gender,
				v.Guardian.Name, v.Guardian.Phone, v.Guardian.Email,
				v.Status, v.EnrolledAt, v.CreatedAt, v.UpdatedAt)
		}
		if err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `DELETE FROM student_subjects WHERE student_id=$1`, v.ID); err != nil {
		return err
	}
	for _, sid := range v.Subjects {
		if sid == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO student_subjects (student_id, subject_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
		`, v.ID, sid); err != nil {
			return err
		}
	}
	return nil
}

func upsertParent(ctx context.Context, tx pgx.Tx, v *store.Parent) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO parents (id, school_id, user_id, name, phone, email, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		ON CONFLICT (id) DO UPDATE SET
			user_id=EXCLUDED.user_id, name=EXCLUDED.name, phone=EXCLUDED.phone,
			email=EXCLUDED.email, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.UserID, v.Name, v.Phone, v.Email, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertStudentParent(ctx context.Context, tx pgx.Tx, v *store.StudentParent) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO student_parents (id, school_id, student_id, parent_user_id,
			relationship, is_primary, status, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		ON CONFLICT (id) DO UPDATE SET
			relationship=EXCLUDED.relationship, is_primary=EXCLUDED.is_primary,
			status=EXCLUDED.status
	`, v.ID, v.SchoolID, v.StudentID, v.ParentUserID,
		v.Relationship, v.IsPrimary, "active", v.CreatedAt)
	return err
}

func upsertAttendance(ctx context.Context, tx pgx.Tx, v *store.Attendance) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO attendance (id, school_id, academic_year_id, student_id, class_id,
			teacher_id, date, period, status, marked_by, source, note,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,$8,$9,$10,$11,$12,$13)
		ON CONFLICT (id) DO UPDATE SET
			date=EXCLUDED.date, period=EXCLUDED.period, status=EXCLUDED.status,
			marked_by=EXCLUDED.marked_by, source=EXCLUDED.source, note=EXCLUDED.note,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, nullableString(v.AcademicYearID), v.StudentID, v.ClassID,
		v.Date, v.Period, v.Status, v.MarkedBy, v.Source, v.Note,
		v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertExam(ctx context.Context, tx pgx.Tx, v *store.Exam) error {
	examType := v.Type
	if examType == "" {
		examType = "exam"
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO exams (id, school_id, academic_year_id, class_id, teacher_id,
			subject, title, type, starts_at, max_marks, status, description,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (id) DO UPDATE SET
			class_id=EXCLUDED.class_id, teacher_id=EXCLUDED.teacher_id,
			subject=EXCLUDED.subject, title=EXCLUDED.title, type=EXCLUDED.type,
			starts_at=EXCLUDED.starts_at, max_marks=EXCLUDED.max_marks,
			status=EXCLUDED.status, description=EXCLUDED.description,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, nullableString(v.AcademicYearID), v.ClassID, nullableString(v.TeacherID),
		v.Subject, v.Title, examType, v.StartsAt, v.MaxMarks, v.Status, v.Description,
		v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertResult(ctx context.Context, tx pgx.Tx, v *store.Result) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO results (id, school_id, academic_year_id, exam_id, class_id, student_id,
			obtained_marks, remarks, graded_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		ON CONFLICT (id) DO UPDATE SET
			obtained_marks=EXCLUDED.obtained_marks, remarks=EXCLUDED.remarks,
			graded_at=EXCLUDED.graded_at, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, nullableString(v.AcademicYearID), v.ExamID, v.ClassID, v.StudentID,
		v.ObtainedMarks, v.Remarks, v.GradedAt, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertHomework(ctx context.Context, tx pgx.Tx, v *store.Homework) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO homework (id, school_id, academic_year_id, class_id, section, teacher_id,
			subject_id, subject, title, instructions, due_at, status, attachments,
			visibility, created_by, created_by_role, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
		ON CONFLICT (id) DO UPDATE SET
			class_id=EXCLUDED.class_id, section=EXCLUDED.section, teacher_id=EXCLUDED.teacher_id,
			subject_id=EXCLUDED.subject_id, subject=EXCLUDED.subject,
			title=EXCLUDED.title, instructions=EXCLUDED.instructions,
			due_at=EXCLUDED.due_at, status=EXCLUDED.status,
			attachments=EXCLUDED.attachments, visibility=EXCLUDED.visibility,
			created_by=EXCLUDED.created_by, created_by_role=EXCLUDED.created_by_role,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, nullableString(v.AcademicYearID), v.ClassID, nullableString(v.Section), v.TeacherID,
		nullableString(v.SubjectID), v.Subject, v.Title, v.Instructions, v.DueAt, v.Status, v.Attachments,
		v.Visibility, v.CreatedBy, v.CreatedByRole, v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM homework_submissions WHERE homework_id=$1`, v.ID); err != nil {
		return err
	}
	for _, sub := range v.Submissions {
		if _, err := tx.Exec(ctx, `
			INSERT INTO homework_submissions (id, homework_id, student_id, submitted_at, graded_at,
				status, attachment_urls, marks, feedback)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
			ON CONFLICT (id) DO NOTHING
		`, store.NewID("hws"), v.ID, sub.StudentID, sub.SubmittedAt, sub.GradedAt,
			sub.Status, sub.AttachmentURLs, sub.Marks, sub.Feedback); err != nil {
			return err
		}
	}
	return nil
}

func upsertAnnouncement(ctx context.Context, tx pgx.Tx, v *store.Announcement) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO announcements (id, school_id, title, body, audience, priority,
			pinned_till, created_by, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, body=EXCLUDED.body, audience=EXCLUDED.audience,
			priority=EXCLUDED.priority, pinned_till=EXCLUDED.pinned_till,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Title, v.Body, defaultStr(v.Audience, "all"),
		defaultStr(v.Priority, "normal"), v.PinnedTill, nullableString(v.CreatedBy),
		v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertBehavior(ctx context.Context, tx pgx.Tx, v *store.Behavior) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO behaviors (id, school_id, student_id, class_id, teacher_id,
			incident_type, description, severity, action_taken, status,
			warning_count, parent_notified, notes, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		ON CONFLICT (id) DO UPDATE SET
			incident_type=EXCLUDED.incident_type, description=EXCLUDED.description,
			severity=EXCLUDED.severity, action_taken=EXCLUDED.action_taken,
			status=EXCLUDED.status, warning_count=EXCLUDED.warning_count,
			parent_notified=EXCLUDED.parent_notified, notes=EXCLUDED.notes,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.StudentID, v.ClassID, v.TeacherID,
		v.IncidentType, v.Description, v.Severity, v.ActionTaken, v.Status,
		v.WarningCount, v.ParentNotified, v.Notes, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertEvent(ctx context.Context, tx pgx.Tx, v *store.Event) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO events (id, school_id, title, description, event_type, start_date, end_date,
			start_time, end_time, location, visibility, organizer, status, created_by,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, description=EXCLUDED.description, event_type=EXCLUDED.event_type,
			start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date,
			start_time=EXCLUDED.start_time, end_time=EXCLUDED.end_time,
			location=EXCLUDED.location, visibility=EXCLUDED.visibility,
			organizer=EXCLUDED.organizer, status=EXCLUDED.status,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Title, v.Description, defaultStr(v.EventType, "other"),
		v.StartDate, v.EndDate, v.StartTime, v.EndTime, v.Location,
		defaultStr(v.Visibility, "all"), v.Organizer, defaultStr(v.Status, "scheduled"),
		nullableString(v.CreatedBy), v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM event_target_classes WHERE event_id=$1`, v.ID); err != nil {
		return err
	}
	for _, cid := range v.TargetClassIDs {
		if cid == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO event_target_classes (event_id, class_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
		`, v.ID, cid); err != nil {
			return err
		}
	}
	return nil
}

func upsertLeave(ctx context.Context, tx pgx.Tx, v *store.Leave) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO leaves (id, school_id, requester_type, requester_id, requester_name,
			leave_type, start_date, end_date, reason, status, attachments,
			approved_by, approved_at, rejection_reason, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		ON CONFLICT (id) DO UPDATE SET
			leave_type=EXCLUDED.leave_type, start_date=EXCLUDED.start_date,
			end_date=EXCLUDED.end_date, reason=EXCLUDED.reason, status=EXCLUDED.status,
			attachments=EXCLUDED.attachments, approved_by=EXCLUDED.approved_by,
			approved_at=EXCLUDED.approved_at, rejection_reason=EXCLUDED.rejection_reason,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.RequesterType, v.RequesterID, v.RequesterName,
		v.LeaveType, v.StartDate, v.EndDate, v.Reason, v.Status, v.Attachments,
		nullableString(v.ApprovedBy), v.ApprovedAt, v.RejectionReason, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertTimetable(ctx context.Context, tx pgx.Tx, v *store.Timetable) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO timetables (id, school_id, academic_year_id, class_id, status,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (id) DO UPDATE SET
			class_id=EXCLUDED.class_id, status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, nullableString(v.AcademicYearID), v.ClassID, v.Status,
		v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM timetable_sessions WHERE timetable_id=$1`, v.ID); err != nil {
		return err
	}
	for _, s := range v.Sessions {
		if _, err := tx.Exec(ctx, `
			INSERT INTO timetable_sessions (id, timetable_id, day, period, starts_at, ends_at,
				subject_id, subject, teacher_id, room)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		`, store.NewID("ttbsess"), v.ID, s.Day, s.Period, s.StartsAt, s.EndsAt,
			nullableString(s.SubjectID), s.Subject, nullableString(s.TeacherID), s.Room); err != nil {
			return err
		}
	}
	return nil
}

func upsertLiveClass(ctx context.Context, tx pgx.Tx, v *store.LiveClass) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO live_classes (id, school_id, academic_year_id, class_id, subject, title,
			starts_at, ends_at, host_teacher_id, join_url, provider, status,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (id) DO UPDATE SET
			subject=EXCLUDED.subject, title=EXCLUDED.title,
			starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at,
			host_teacher_id=EXCLUDED.host_teacher_id, join_url=EXCLUDED.join_url,
			provider=EXCLUDED.provider, status=EXCLUDED.status,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, nullableString(v.AcademicYearID), v.ClassID, v.Subject, v.Title,
		v.StartsAt, v.EndsAt, nullableString(v.HostTeacherID), v.JoinURL,
		defaultStr(v.Provider, "jitsi"), v.Status, v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertNotification(ctx context.Context, tx pgx.Tx, v *store.Notification) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO notifications (id, school_id, user_id, title, body, category, read, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, body=EXCLUDED.body, category=EXCLUDED.category,
			read=EXCLUDED.read
	`, v.ID, v.SchoolID, v.UserID, v.Title, v.Body, v.Category, v.Read, v.CreatedAt)
	return err
}

func upsertFeeType(ctx context.Context, tx pgx.Tx, v *store.FeeType) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO fee_types (id, school_id, name, description, is_recurring, category,
			status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT (id) DO UPDATE SET
			name=EXCLUDED.name, description=EXCLUDED.description,
			is_recurring=EXCLUDED.is_recurring, category=EXCLUDED.category,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Name, v.Description, v.IsRecurring,
		defaultStr(v.Category, "academic"), defaultStr(v.Status, "active"),
		v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertClassFee(ctx context.Context, tx pgx.Tx, v *store.ClassFee) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO class_fees (id, school_id, class_id, academic_year_id, fee_type_id,
			amount, type, recurring_cycle, due_month, due_year, notes, status,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (id) DO UPDATE SET
			amount=EXCLUDED.amount, type=EXCLUDED.type,
			recurring_cycle=EXCLUDED.recurring_cycle, due_month=EXCLUDED.due_month,
			due_year=EXCLUDED.due_year, notes=EXCLUDED.notes,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.ClassID, v.AcademicYearID, v.FeeTypeID,
		v.Amount, defaultStr(v.Type, "recurring"), defaultStr(v.RecurringCycle, "monthly"),
		v.DueMonth, v.DueYear, v.Notes, defaultStr(v.Status, "active"),
		v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertFee(ctx context.Context, tx pgx.Tx, v *store.Fee) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO fees (id, school_id, student_id, class_id, academic_year_id, fee_type_id,
			invoice_no, title, amount, currency, month, year, due_at, status,
			paid_amount, adjustment_amount, generated_at, generated_by,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
		ON CONFLICT (id) DO UPDATE SET
			class_id=EXCLUDED.class_id, fee_type_id=EXCLUDED.fee_type_id,
			invoice_no=EXCLUDED.invoice_no, title=EXCLUDED.title,
			amount=EXCLUDED.amount, currency=EXCLUDED.currency,
			month=EXCLUDED.month, year=EXCLUDED.year, due_at=EXCLUDED.due_at,
			status=EXCLUDED.status, paid_amount=EXCLUDED.paid_amount,
			adjustment_amount=EXCLUDED.adjustment_amount,
			generated_at=EXCLUDED.generated_at, generated_by=EXCLUDED.generated_by,
			updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.StudentID, nullableString(v.ClassID), nullableString(v.AcademicYearID),
		nullableString(v.FeeTypeID), v.InvoiceNo, v.Title, v.Amount,
		defaultStr(v.Currency, "USD"), v.Month, v.Year, v.DueAt,
		defaultStr(v.Status, "unpaid"), v.PaidAmount, v.AdjustmentAmount,
		v.GeneratedAt, nullableString(v.GeneratedBy), v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM fee_components WHERE fee_id=$1`, v.ID); err != nil {
		return err
	}
	for _, c := range v.FeeComponents {
		if _, err := tx.Exec(ctx, `
			INSERT INTO fee_components (id, fee_id, fee_type_id, fee_type, amount, paid_amount)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, store.NewID("fcomp"), v.ID, nullableString(c.FeeTypeID), c.FeeType,
			c.Amount, c.PaidAmount); err != nil {
			return err
		}
	}
	return nil
}

func upsertFeeAdjustment(ctx context.Context, tx pgx.Tx, v *store.FeeAdjustment) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO fee_adjustments (id, school_id, student_id, academic_year_id, type, amount,
			reason, valid_from, valid_until, status, applied_by, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		ON CONFLICT (id) DO UPDATE SET
			type=EXCLUDED.type, amount=EXCLUDED.amount, reason=EXCLUDED.reason,
			valid_from=EXCLUDED.valid_from, valid_until=EXCLUDED.valid_until,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.StudentID, v.AcademicYearID, v.Type, v.Amount,
		v.Reason, v.ValidFrom, v.ValidUntil, defaultStr(v.Status, "active"),
		nullableString(v.AppliedBy), v.CreatedAt, v.UpdatedAt)
	return err
}

func upsertFeePayment(ctx context.Context, tx pgx.Tx, v *store.FeePayment) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO fee_payments (id, school_id, receipt_no, student_id, class_id,
			academic_year_id, amount, payment_date, payment_method, reference_no,
			notes, status, received_by, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		ON CONFLICT (id) DO UPDATE SET
			receipt_no=EXCLUDED.receipt_no, amount=EXCLUDED.amount,
			payment_date=EXCLUDED.payment_date, payment_method=EXCLUDED.payment_method,
			reference_no=EXCLUDED.reference_no, notes=EXCLUDED.notes,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.ReceiptNo, v.StudentID, nullableString(v.ClassID),
		nullableString(v.AcademicYearID), v.Amount, v.PaymentDate, v.PaymentMethod,
		v.ReferenceNo, v.Notes, defaultStr(v.Status, "completed"),
		nullableString(v.ReceivedBy), v.CreatedAt, v.UpdatedAt)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM fee_payment_allocations WHERE fee_payment_id=$1`, v.ID); err != nil {
		return err
	}
	for _, alloc := range v.Allocations {
		if _, err := tx.Exec(ctx, `
			INSERT INTO fee_payment_allocations (id, fee_payment_id, fee_id, fee_type_id, month, amount)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, store.NewID("falloc"), v.ID, nullableString(alloc.FeeID),
			nullableString(alloc.FeeTypeID), alloc.Month, alloc.Amount); err != nil {
			return err
		}
	}
	return nil
}

func upsertSchoolSettings(ctx context.Context, tx pgx.Tx, v *store.SchoolSettings) error {
	profile, err := jsonOrEmpty(v.Profile)
	if err != nil {
		return err
	}
	branding, err := jsonOrEmpty(v.Branding)
	if err != nil {
		return err
	}
	academic, err := jsonOrEmpty(v.Academic)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO school_settings (school_id, profile, branding, academic, updated_at)
		VALUES ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5)
		ON CONFLICT (school_id) DO UPDATE SET
			profile=EXCLUDED.profile, branding=EXCLUDED.branding, academic=EXCLUDED.academic,
			updated_at=EXCLUDED.updated_at
	`, v.SchoolID, profile, branding, academic, v.UpdatedAt)
	return err
}

func upsertAuditLog(ctx context.Context, tx pgx.Tx, v *store.AuditLog) error {
	before, err := jsonOrEmpty(v.Before)
	if err != nil {
		return err
	}
	after, err := jsonOrEmpty(v.After)
	if err != nil {
		return err
	}
	meta, err := jsonOrEmpty(v.Metadata)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, school_id, actor_user_id, actor_role, actor_email,
			action, entity_type, entity_id, before, after, metadata,
			ip, user_agent, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14)
		ON CONFLICT (id) DO NOTHING
	`, v.ID, v.SchoolID, v.ActorID, v.ActorRole, v.ActorEmail,
		v.Action, v.EntityType, v.EntityID, before, after, meta,
		"", "", v.CreatedAt)
	return err
}

// ─── Certificate Templates ───────────────────────────────────────────────

func upsertCertificateTemplate(ctx context.Context, tx pgx.Tx, v *store.CertificateTemplate) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO certificate_templates (id, school_id, name, type, orientation,
			background_url, watermark_url, border_style, body_text, elements,
			is_default, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (id) DO UPDATE SET
			name=EXCLUDED.name, type=EXCLUDED.type, orientation=EXCLUDED.orientation,
			background_url=EXCLUDED.background_url, watermark_url=EXCLUDED.watermark_url,
			border_style=EXCLUDED.border_style, body_text=EXCLUDED.body_text,
			elements=EXCLUDED.elements, is_default=EXCLUDED.is_default,
			status=EXCLUDED.status, updated_at=EXCLUDED.updated_at
	`, v.ID, v.SchoolID, v.Name, v.Type, v.Orientation,
		v.BackgroundURL, v.WatermarkURL, v.BorderStyle, v.BodyText, v.Elements,
		v.IsDefault, v.Status, v.CreatedAt, v.UpdatedAt)
	return err
}

// ─── Generated Certificates ──────────────────────────────────────────────

func upsertGeneratedCertificate(ctx context.Context, tx pgx.Tx, v *store.GeneratedCertificate) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO generated_certificates (id, school_id, template_id, student_id,
			student_name, class_name, certificate_type, certificate_no,
			verification_code, qr_code_url, pdf_url, issue_date, expiry_date,
			status, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		ON CONFLICT (id) DO UPDATE SET
			student_name=EXCLUDED.student_name, class_name=EXCLUDED.class_name,
			status=EXCLUDED.status, qr_code_url=EXCLUDED.qr_code_url,
			pdf_url=EXCLUDED.pdf_url
	`, v.ID, v.SchoolID, v.TemplateID, v.StudentID,
		v.StudentName, v.ClassName, v.CertificateType, v.CertificateNo,
		v.VerificationCode, v.QRCodeURL, v.PDFURL, v.IssueDate, v.ExpiryDate,
		v.Status, v.CreatedAt)
	return err
}
