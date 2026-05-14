#!/usr/bin/env bash
# Phase 2.1 integration smoke. Boots the Go backend (assumed running on :8080)
# and walks every newly-implemented domain end-to-end.
#
# Usage: ./scripts/smoke.sh
# Requires: curl, python3.

set -euo pipefail

BASE="${BASE:-http://localhost:8080}"

step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✔ %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$1"; exit 1; }

# ─── Auth ─────────────────────────────────────────────────────────────────
step "Login (admin)"
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@school.test","password":"admin123","role":"admin"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
[ -n "$TOKEN" ] && ok "got token"

H="-H authorization:Bearer\ $TOKEN -H content-type:application/json"

step "Endpoint inventory (every URL the React app calls)"
for ep in \
  /api/academic-years \
  /api/students /api/teachers /api/classes /api/subjects \
  /api/attendance /api/exams /api/results /api/homework \
  /api/timetable /api/announcements /api/behavior /api/events \
  /api/leave /api/live/classes /api/notifications /api/settings \
  /api/parent/student-info /api/parent/dashboard/stats \
  /api/parent/student-attendance /api/parent/student-results \
  /api/parent/child/homework /api/parent/child/announcements \
  /api/parent/performance-chart /api/parent/fees \
  /api/school/fees/dashboard-stats /api/domain/status \
  /api/analytics/dashboard
do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer $TOKEN" "$BASE$ep")
  printf '  %s %s\n' "$code" "$ep"
  [ "$code" = "200" ] || fail "$ep"
done
ok "all endpoints 200"

# ─── Round-trip: announcement ─────────────────────────────────────────────
step "POST /api/announcements"
NEW_ANN=$(curl -s -X POST "$BASE/api/announcements" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"title":"Smoke ann","body":"hi","audience":"all","priority":"normal"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")
[ -n "$NEW_ANN" ] && ok "created $NEW_ANN"

step "GET /api/announcements (count >= 1)"
COUNT=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/announcements" \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))")
[ "$COUNT" -ge 1 ] && ok "count=$COUNT"

# ─── Round-trip: bulk attendance ──────────────────────────────────────────
step "POST /api/attendance/mark"
SAVED=$(curl -s -X POST "$BASE/api/attendance/mark" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"class_id":"cls_1","date":"2025-09-01","period":1,"records":{"stu_1":"present","stu_2":"absent"}}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['saved'])")
[ "$SAVED" = "2" ] && ok "saved=$SAVED"

step "GET /api/attendance returns records"
ATT_COUNT=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/attendance" \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))")
[ "$ATT_COUNT" -ge 2 ] && ok "rows=$ATT_COUNT"

# ─── Round-trip: exam + result ────────────────────────────────────────────
step "POST /api/exams"
EXAM_ID=$(curl -s -X POST "$BASE/api/exams" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"class_id":"cls_1","subject":"Mathematics","title":"Smoke quiz","starts_at":"2025-10-01","max_marks":50}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")
[ -n "$EXAM_ID" ] && ok "exam $EXAM_ID"

step "POST /api/exams/{id}/results"
SAVED_R=$(curl -s -X POST "$BASE/api/exams/$EXAM_ID/results" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d "{\"results\":[{\"student_id\":\"stu_1\",\"obtained_marks\":42},{\"student_id\":\"stu_2\",\"obtained_marks\":28}]}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['saved'])")
[ "$SAVED_R" = "2" ] && ok "saved=$SAVED_R"

step "GET /api/exams/{id}/results includes grade"
GRADES=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/exams/$EXAM_ID/results" \
  | python3 -c "import sys,json; print(','.join(r['grade'] for r in json.load(sys.stdin)['data']))")
ok "grades=$GRADES"

# ─── Round-trip: homework ─────────────────────────────────────────────────
step "POST /api/homework"
HW_ID=$(curl -s -X POST "$BASE/api/homework" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"class_id":"cls_1","teacher_id":"tch_1","subject_id":"sub_math","title":"Smoke HW","instructions":"hi","due_at":"2025-09-30","status":"assigned"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")
[ -n "$HW_ID" ] && ok "homework $HW_ID"

# ─── Tenant guard ─────────────────────────────────────────────────────────
step "Tenant guard: 401 without token"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/students")
[ "$CODE" = "401" ] && ok "401 enforced"

# ─── Permission guard ─────────────────────────────────────────────────────
step "Parent dashboard renders"
curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/parent/dashboard/stats" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['ok']; print('  attendance:', d['data']['attendance'])"
ok "parent dashboard ok"

printf '\n\033[1;32mAll Phase 2.1 smoke checks passed.\033[0m\n'
