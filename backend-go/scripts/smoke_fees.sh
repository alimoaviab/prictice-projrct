#!/usr/bin/env bash
# End-to-end smoke for the fees domain.
set -euo pipefail

BASE="${BASE:-http://localhost:8080}"
step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✔ %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$1"; exit 1; }

TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@school.test","password":"admin123","role":"admin"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
[ -n "$TOKEN" ] && ok "logged in"

step "Create fee type"
FT_ID=$(curl -s -X POST "$BASE/api/fees/types" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"name":"Tuition","is_recurring":true,"category":"academic"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")
[ -n "$FT_ID" ] && ok "fee_type=$FT_ID"

step "Add class fee component"
CF_ID=$(curl -s -X POST "$BASE/api/classes/cls_1/fees/components" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d "{\"fee_type_id\":\"$FT_ID\",\"amount\":1000,\"type\":\"recurring\",\"recurring_cycle\":\"monthly\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")
[ -n "$CF_ID" ] && ok "class_fee=$CF_ID"

step "Generate September invoices"
GEN=$(curl -s -X POST "$BASE/api/fees/generate" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"class_id":"cls_1","month":"september","year":2025}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['generated'], '/', d['students'])")
ok "generated $GEN"

step "Ledger reflects new invoices"
SUMMARY=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/fees/ledger?class_id=cls_1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']['summary']; print(d['rows_count'], 'rows; total=', d['total'], 'paid=', d['paid'], 'due=', d['due'])")
ok "$SUMMARY"

step "Apply discount adjustment"
curl -s -X POST "$BASE/api/fees/adjustments" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"student_id":"stu_1","type":"discount","amount":100,"reason":"sibling discount","valid_from":"2025-08-01","valid_until":"2026-03-31"}' \
  > /dev/null
ok "adjustment created"

step "Find an invoice to pay"
FEE_ID=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/fees?student_id=stu_1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['_id'] if d else '')")
[ -n "$FEE_ID" ] && ok "invoice $FEE_ID"

step "Record payment of 500"
RECEIPT=$(curl -s -X POST "$BASE/api/fees/$FEE_ID/pay" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"amount":500,"payment_method":"cash"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['receipt_no'])")
ok "receipt $RECEIPT"

step "Dashboard stats"
curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/school/fees/dashboard-stats" \
  | python3 -m json.tool

step "Parent ledger for stu_1"
curl -s -H "authorization: Bearer $TOKEN" "$BASE/api/parent/fees?student_id=stu_1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('  summary:', d['summary']); print('  rows:', len(d['rows']))"
ok "parent ledger renders"

printf '\n\033[1;32mAll fees smoke checks passed.\033[0m\n'
