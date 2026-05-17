#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Eduplexo Complete Data Seed Script
# ═══════════════════════════════════════════════════════════════════════════
# Seeds: 390 students, 25 teachers, 22 classes, attendance (1 month),
#         exams, results, homework, events, timetable, fees, behavior, leaves,
#         live classes, etc.
#
# Student logins: student1@gmail.com ... student390@gmail.com (pass: Test@123)
# Teacher logins: teacher1@gmail.com ... teacher25@gmail.com (pass: Test@123)
#
# Usage: ./scripts/seed_complete_data.sh

set -euo pipefail

SCHOOL_ID="sch_ea34b51092ee0401"
YEAR_ID="ay_bc71bcb881a8ecbb"
DB_CMD="docker exec school_postgres psql -U school_user -d school_db"

echo "═══════════════════════════════════════════════════════════════"
echo " Eduplexo Complete Data Seed"
echo " School: $SCHOOL_ID | Year: $YEAR_ID"
echo "═══════════════════════════════════════════════════════════════"

# ─── Clean existing seed data ─────────────────────────────────────────────
echo "🧹 Cleaning old seed data..."
$DB_CMD -c "DELETE FROM attendance WHERE school_id='$SCHOOL_ID' AND student_id LIKE 'seed_stu_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM results WHERE school_id='$SCHOOL_ID' AND student_id LIKE 'seed_stu_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM fees WHERE school_id='$SCHOOL_ID' AND student_id LIKE 'seed_stu_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM behaviors WHERE school_id='$SCHOOL_ID' AND student_id LIKE 'seed_stu_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM homework WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_hw_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM exams WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_exam_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM events WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_evt_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM leaves WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_lv_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM live_classes WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_lc_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM students WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_stu_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM teachers WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_tch_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM classes WHERE school_id='$SCHOOL_ID' AND id LIKE 'seed_cls_%';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM users WHERE school_id='$SCHOOL_ID' AND email LIKE 'student%@gmail.com';" 2>/dev/null || true
$DB_CMD -c "DELETE FROM users WHERE school_id='$SCHOOL_ID' AND email LIKE 'teacher%@gmail.com';" 2>/dev/null || true

# ─── Create Classes (22) ──────────────────────────────────────────────────
echo "🏛️ Creating 22 classes..."
CLASSES=("Nursery" "KG" "Class 1" "Class 2" "Class 3" "Class 4" "Class 5" "Class 6" "Class 7" "Class 8" "Class 9A" "Class 9B" "Class 10A" "Class 10B" "Class 11 Science" "Class 11 Arts" "Class 12 Science" "Class 12 Arts" "O-Level I" "O-Level II" "A-Level I" "A-Level II")

for i in "${!CLASSES[@]}"; do
  idx=$((i+1))
  $DB_CMD -c "INSERT INTO classes (id, school_id, academic_year_id, name, section, capacity, status, created_at, updated_at)
    VALUES ('seed_cls_$idx', '$SCHOOL_ID', '$YEAR_ID', '${CLASSES[$i]}', 'A', 50, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 22 classes created"

# ─── Create Teachers (25) with user accounts ──────────────────────────────
echo "👨‍🏫 Creating 25 teachers..."
TEACHER_NAMES=("Ahmad Ali" "Fatima Khan" "Hassan Raza" "Ayesha Malik" "Usman Ahmed" "Sana Tariq" "Bilal Shah" "Nadia Hussain" "Imran Qureshi" "Zainab Akhtar" "Kamran Javed" "Hira Nawaz" "Asad Mehmood" "Rabia Siddiqui" "Faisal Iqbal" "Amina Bibi" "Tariq Mahmood" "Saima Noor" "Waqas Haider" "Bushra Parveen" "Naveed Aslam" "Samina Yasmeen" "Rizwan Akram" "Tahira Begum" "Shahid Latif")
SUBJECTS=("Mathematics" "English" "Urdu" "Science" "Physics" "Chemistry" "Biology" "Computer" "Islamiat" "Pakistan Studies" "Social Studies" "Art" "Physical Education" "Economics" "Accounting" "Geography" "History" "General Knowledge" "Arabic" "Sindhi" "Punjabi" "Home Economics" "Civics" "Statistics" "Environmental Science")

for i in $(seq 1 25); do
  NAME="${TEACHER_NAMES[$((i-1))]}"
  FIRST=$(echo "$NAME" | cut -d' ' -f1)
  LAST=$(echo "$NAME" | cut -d' ' -f2-)
  SUBJ="${SUBJECTS[$((i-1))]}"
  EMAIL="teacher${i}@gmail.com"
  
  # Create user account
  $DB_CMD -c "INSERT INTO users (id, school_id, email, password_hash, role, permissions, profile_first, profile_last, profile_phone, profile_avatar, status, created_at, updated_at)
    VALUES ('seed_usr_tch_$i', '$SCHOOL_ID', '$EMAIL', 'Test@123', 'teacher', '{\"teachers:view\",\"attendance:view\",\"attendance:create\"}', '$FIRST', '$LAST', '030${i}1234567', '', 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null

  # Create teacher
  $DB_CMD -c "INSERT INTO teachers (id, school_id, academic_year_id, user_id, email, employee_no, first_name, last_name, phone, qualification, status, joined_at, created_at, updated_at)
    VALUES ('seed_tch_$i', '$SCHOOL_ID', '$YEAR_ID', 'seed_usr_tch_$i', '$EMAIL', 'EMP-$(printf '%03d' $i)', '$FIRST', '$LAST', '030${i}1234567', 'M.Ed', 'active', NOW()-interval '1 year', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 25 teachers created (teacher1@gmail.com ... teacher25@gmail.com)"

# ─── Create Students (390) with user accounts ─────────────────────────────
echo "👨‍🎓 Creating 390 students (this takes a moment)..."

FIRST_NAMES=("Ali" "Ahmed" "Hassan" "Bilal" "Usman" "Zain" "Hamza" "Omar" "Saad" "Fahad" "Ayesha" "Fatima" "Hira" "Sana" "Zainab" "Amina" "Rabia" "Nadia" "Bushra" "Samina")
LAST_NAMES=("Khan" "Ahmed" "Malik" "Shah" "Raza" "Qureshi" "Hussain" "Akhtar" "Javed" "Siddiqui" "Nawaz" "Mehmood" "Iqbal" "Tariq" "Aslam" "Latif" "Haider" "Noor" "Parveen" "Begum")

SQL_USERS=""
SQL_STUDENTS=""

for i in $(seq 1 390); do
  FIRST_IDX=$(( (i-1) % 20 ))
  LAST_IDX=$(( (i-1) / 20 % 20 ))
  FIRST="${FIRST_NAMES[$FIRST_IDX]}"
  LAST="${LAST_NAMES[$LAST_IDX]}"
  EMAIL="student${i}@gmail.com"
  CLASS_NUM=$(( (i-1) % 22 + 1 ))
  CLASS_ID="seed_cls_${CLASS_NUM}"
  GENDER="male"
  if [ $FIRST_IDX -ge 10 ]; then GENDER="female"; fi

  SQL_USERS+="('seed_usr_stu_$i','$SCHOOL_ID','$EMAIL','Test@123','student','{\"students:view\"}','$FIRST','$LAST','','','active',NOW(),NOW()),"
  SQL_STUDENTS+="('seed_stu_$i','$SCHOOL_ID','$YEAR_ID','seed_usr_stu_$i','$CLASS_ID','STU-$(printf '%04d' $i)','$FIRST','$LAST','A','$i',NULL,'$GENDER','Parent of $FIRST','03001234567','','active',NOW(),NOW(),NOW()),"
done

# Remove trailing comma and execute
SQL_USERS="${SQL_USERS%,}"
SQL_STUDENTS="${SQL_STUDENTS%,}"

$DB_CMD -c "INSERT INTO users (id, school_id, email, password_hash, role, permissions, profile_first, profile_last, profile_phone, profile_avatar, status, created_at, updated_at) VALUES $SQL_USERS ON CONFLICT (id) DO NOTHING;" 2>/dev/null
$DB_CMD -c "INSERT INTO students (id, school_id, academic_year_id, user_id, class_id, admission_no, first_name, last_name, section, roll_no, date_of_birth, gender, guardian_name, guardian_phone, guardian_email, status, enrolled_at, created_at, updated_at) VALUES $SQL_STUDENTS ON CONFLICT (id) DO NOTHING;" 2>/dev/null
echo "  ✅ 390 students created (student1@gmail.com ... student390@gmail.com)"

# ─── Create Attendance (1 month, ~30 days) ────────────────────────────────
echo "📋 Creating 1 month of attendance data..."
for DAY_OFFSET in $(seq 0 29); do
  DATE=$(date -v-${DAY_OFFSET}d +%Y-%m-%d 2>/dev/null || date -d "-${DAY_OFFSET} days" +%Y-%m-%d)
  # Mark attendance for ~350 students per day (some absent)
  $DB_CMD -c "
    INSERT INTO attendance (id, school_id, academic_year_id, student_id, class_id, date, period, status, marked_by, source, note, created_at, updated_at)
    SELECT 
      'seed_att_' || s.id || '_${DAY_OFFSET}',
      '$SCHOOL_ID', '$YEAR_ID', s.id, s.class_id, '$DATE'::date, 1,
      CASE WHEN random() < 0.88 THEN 'present' WHEN random() < 0.95 THEN 'late' ELSE 'absent' END,
      'seed_tch_1', 'manual', '', NOW(), NOW()
    FROM students s WHERE s.school_id='$SCHOOL_ID' AND s.id LIKE 'seed_stu_%'
    ON CONFLICT DO NOTHING;
  " 2>/dev/null
done
echo "  ✅ 30 days of attendance created (~11,700 records)"

# ─── Create Exams (10) ────────────────────────────────────────────────────
echo "📝 Creating exams..."
EXAM_TITLES=("Mid Term Math" "Mid Term English" "Mid Term Science" "Mid Term Urdu" "Monthly Test 1" "Monthly Test 2" "Quiz Math" "Quiz Science" "Unit Test English" "Practice Exam")
for i in $(seq 1 10); do
  CLASS_ID="seed_cls_$(( (i-1) % 22 + 1 ))"
  SUBJ="${SUBJECTS[$((i-1))]}"
  DAYS_AGO=$(( (i-1) * 3 + 5 ))
  $DB_CMD -c "INSERT INTO exams (id, school_id, academic_year_id, class_id, teacher_id, subject, title, type, starts_at, max_marks, status, description, created_at, updated_at)
    VALUES ('seed_exam_$i', '$SCHOOL_ID', '$YEAR_ID', '$CLASS_ID', 'seed_tch_$i', '$SUBJ', '${EXAM_TITLES[$((i-1))]}', 'exam', NOW()-interval '$DAYS_AGO days', 100, 'completed', 'Seeded exam', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 10 exams created"

# ─── Create Results (for first 5 exams, ~90 students each) ───────────────
echo "📊 Creating exam results..."
for EXAM_IDX in $(seq 1 5); do
  CLASS_NUM=$(( (EXAM_IDX-1) % 22 + 1 ))
  $DB_CMD -c "
    INSERT INTO results (id, school_id, academic_year_id, exam_id, class_id, student_id, obtained_marks, remarks, graded_at, created_at, updated_at)
    SELECT 
      'seed_res_' || s.id || '_$EXAM_IDX',
      '$SCHOOL_ID', '$YEAR_ID', 'seed_exam_$EXAM_IDX', s.class_id, s.id,
      (random() * 60 + 40)::int,
      CASE WHEN random() > 0.7 THEN 'Good' WHEN random() > 0.4 THEN 'Average' ELSE 'Needs improvement' END,
      NOW(), NOW(), NOW()
    FROM students s WHERE s.school_id='$SCHOOL_ID' AND s.class_id='seed_cls_$CLASS_NUM'
    ON CONFLICT DO NOTHING;
  " 2>/dev/null
done
echo "  ✅ Results created for 5 exams"

# ─── Create Homework (15) ─────────────────────────────────────────────────
echo "📚 Creating homework..."
for i in $(seq 1 15); do
  CLASS_ID="seed_cls_$(( (i-1) % 22 + 1 ))"
  DAYS=$(( i * 2 ))
  $DB_CMD -c "INSERT INTO homework (id, school_id, academic_year_id, class_id, section, teacher_id, subject_id, subject, title, instructions, due_at, status, attachments, visibility, created_by, created_by_role, created_at, updated_at)
    VALUES ('seed_hw_$i', '$SCHOOL_ID', '$YEAR_ID', '$CLASS_ID', 'A', 'seed_tch_$(( (i-1) % 25 + 1 ))', '', '${SUBJECTS[$((i-1 % 25))]}', 'Homework $i - ${SUBJECTS[$((i-1 % 25))]}', 'Complete exercises from chapter $i', NOW()+interval '$DAYS days', 'assigned', '{}', 'all', 'seed_tch_1', 'teacher', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 15 homework assignments created"

# ─── Create Events (8) ────────────────────────────────────────────────────
echo "📅 Creating events..."
EVENT_NAMES=("Annual Sports Day" "Science Fair" "Parent Teacher Meeting" "Independence Day" "Quran Competition" "Art Exhibition" "Annual Day" "Farewell Party")
for i in $(seq 1 8); do
  DAYS=$(( i * 5 ))
  $DB_CMD -c "INSERT INTO events (id, school_id, title, description, event_type, start_date, end_date, start_time, end_time, location, visibility, organizer, status, created_by, created_at, updated_at)
    VALUES ('seed_evt_$i', '$SCHOOL_ID', '${EVENT_NAMES[$((i-1))]}', 'School event description', 'academic', NOW()+interval '$DAYS days', NOW()+interval '$DAYS days', '09:00', '14:00', 'School Auditorium', 'all', 'Admin', 'scheduled', 'seed_usr_tch_1', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 8 events created"

# ─── Create Fees (for all students, current month) ────────────────────────
echo "💰 Creating fee records..."
$DB_CMD -c "
  INSERT INTO fees (id, school_id, student_id, class_id, academic_year_id, invoice_no, title, amount, currency, month, year, due_at, status, paid_amount, adjustment_amount, generated_at, generated_by, created_at, updated_at)
  SELECT 
    'seed_fee_' || s.id,
    '$SCHOOL_ID', s.id, s.class_id, '$YEAR_ID',
    'INV-' || s.id,
    'Monthly Fee - May 2026',
    5000, 'PKR', 'May', 2026,
    NOW() + interval '10 days',
    CASE WHEN random() < 0.6 THEN 'paid' WHEN random() < 0.8 THEN 'partial' ELSE 'unpaid' END,
    CASE WHEN random() < 0.6 THEN 5000 WHEN random() < 0.8 THEN 2500 ELSE 0 END,
    0, NOW(), 'admin', NOW(), NOW()
  FROM students s WHERE s.school_id='$SCHOOL_ID' AND s.id LIKE 'seed_stu_%'
  ON CONFLICT DO NOTHING;
" 2>/dev/null
echo "  ✅ 390 fee records created"

# ─── Create Behavior Records (20) ────────────────────────────────────────
echo "📋 Creating behavior records..."
for i in $(seq 1 20); do
  STU_ID="seed_stu_$(( RANDOM % 390 + 1 ))"
  $DB_CMD -c "INSERT INTO behaviors (id, school_id, student_id, class_id, teacher_id, incident_type, description, severity, action_taken, status, warning_count, parent_notified, notes, created_at, updated_at)
    VALUES ('seed_beh_$i', '$SCHOOL_ID', '$STU_ID', 'seed_cls_$(( i % 22 + 1 ))', 'seed_tch_$(( i % 25 + 1 ))', 
    CASE WHEN $i % 3 = 0 THEN 'late_arrival' WHEN $i % 3 = 1 THEN 'misconduct' ELSE 'uniform_violation' END,
    'Behavior incident $i', 
    CASE WHEN $i % 3 = 0 THEN 'low' WHEN $i % 3 = 1 THEN 'medium' ELSE 'high' END,
    'Verbal warning given', 'resolved', 1, true, '', NOW()-interval '$(( i * 2 )) days', NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 20 behavior records created"

# ─── Create Leaves (15) ──────────────────────────────────────────────────
echo "📝 Creating leave requests..."
for i in $(seq 1 15); do
  REQ_TYPE="student"
  REQ_ID="seed_stu_$(( i * 5 ))"
  REQ_NAME="Student $((i*5))"
  if [ $((i % 3)) -eq 0 ]; then
    REQ_TYPE="teacher"
    REQ_ID="seed_tch_$(( i % 25 + 1 ))"
    REQ_NAME="Teacher $((i % 25 + 1))"
  fi
  STATUS="approved"
  if [ $((i % 4)) -eq 0 ]; then STATUS="pending"; fi
  if [ $((i % 5)) -eq 0 ]; then STATUS="rejected"; fi
  
  $DB_CMD -c "INSERT INTO leaves (id, school_id, requester_type, requester_id, requester_name, leave_type, start_date, end_date, reason, status, attachments, approved_by, approved_at, rejection_reason, created_at, updated_at)
    VALUES ('seed_lv_$i', '$SCHOOL_ID', '$REQ_TYPE', '$REQ_ID', '$REQ_NAME', 'sick', NOW()+interval '$((i*2)) days', NOW()+interval '$((i*2+1)) days', 'Not feeling well', '$STATUS', '{}', '', NULL, '', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 15 leave requests created"

# ─── Create Live Classes (10) ────────────────────────────────────────────
echo "🎥 Creating live classes..."
for i in $(seq 1 10); do
  CLASS_ID="seed_cls_$(( (i-1) % 22 + 1 ))"
  HOURS_FROM_NOW=$(( i * 24 ))
  $DB_CMD -c "INSERT INTO live_classes (id, school_id, academic_year_id, class_id, subject, title, starts_at, ends_at, host_teacher_id, join_url, provider, status, created_at, updated_at)
    VALUES ('seed_lc_$i', '$SCHOOL_ID', '$YEAR_ID', '$CLASS_ID', '${SUBJECTS[$((i-1))]}', 'Live Session: ${SUBJECTS[$((i-1))]}', NOW()+interval '$HOURS_FROM_NOW hours', NOW()+interval '$((HOURS_FROM_NOW+1)) hours', 'seed_tch_$i', 'https://meet.jit.si/eduplexo-class-$i', 'jitsi', 'scheduled', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
done
echo "  ✅ 10 live classes scheduled"

# ─── Create Timetable (for first 10 classes) ─────────────────────────────
echo "📅 Creating timetable..."
for CLS in $(seq 1 10); do
  TT_ID="seed_tt_$CLS"
  $DB_CMD -c "INSERT INTO timetables (id, school_id, academic_year_id, class_id, status, created_at, updated_at)
    VALUES ('$TT_ID', '$SCHOOL_ID', '$YEAR_ID', 'seed_cls_$CLS', 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;" 2>/dev/null
  
  # 6 periods per day, Mon-Fri
  for DAY in $(seq 1 5); do
    for PERIOD in $(seq 1 6); do
      TCH_IDX=$(( (CLS + DAY + PERIOD) % 25 + 1 ))
      SUBJ_IDX=$(( (CLS + PERIOD) % 25 ))
      START_H=$((7 + PERIOD))
      $DB_CMD -c "INSERT INTO timetable_sessions (id, timetable_id, day, period, starts_at, ends_at, subject_id, subject, teacher_id, room)
        VALUES ('seed_sess_${CLS}_${DAY}_${PERIOD}', '$TT_ID', $DAY, $PERIOD, '$(printf '%02d' $START_H):00', '$(printf '%02d' $START_H):45', '', '${SUBJECTS[$SUBJ_IDX]}', 'seed_tch_$TCH_IDX', 'Room $CLS')
        ON CONFLICT (id) DO NOTHING;" 2>/dev/null
    done
  done
done
echo "  ✅ Timetable created (10 classes × 5 days × 6 periods = 300 sessions)"

# ─── Update subscription to allow 500 students ───────────────────────────
echo "📋 Updating subscription limit..."
$DB_CMD -c "UPDATE subscriptions SET student_limit=500 WHERE school_id='$SCHOOL_ID' AND status IN ('active','trial');" 2>/dev/null
echo "  ✅ Subscription updated to 500 student limit"

# ─── Final counts ─────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " SEED COMPLETE! Final counts:"
echo "═══════════════════════════════════════════════════════════════"
$DB_CMD -c "
SELECT 'Students' as entity, COUNT(*) as count FROM students WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Teachers', COUNT(*) FROM teachers WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Classes', COUNT(*) FROM classes WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Attendance', COUNT(*) FROM attendance WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Exams', COUNT(*) FROM exams WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Results', COUNT(*) FROM results WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Homework', COUNT(*) FROM homework WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Events', COUNT(*) FROM events WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Fees', COUNT(*) FROM fees WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Behaviors', COUNT(*) FROM behaviors WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Leaves', COUNT(*) FROM leaves WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Live Classes', COUNT(*) FROM live_classes WHERE school_id='$SCHOOL_ID'
UNION ALL SELECT 'Timetable Sessions', COUNT(*) FROM timetable_sessions
ORDER BY entity;
"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " LOGIN CREDENTIALS:"
echo "═══════════════════════════════════════════════════════════════"
echo " Admin:    school@gmail.com / Test@123"
echo " Teachers: teacher1@gmail.com ... teacher25@gmail.com / Test@123"
echo " Students: student1@gmail.com ... student390@gmail.com / Test@123"
echo "═══════════════════════════════════════════════════════════════"
