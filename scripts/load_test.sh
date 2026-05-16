#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Eduplexo Load Test Suite
# ═══════════════════════════════════════════════════════════════════════════
# Prerequisites: brew install hey
# Usage: ./scripts/load_test.sh
# Results saved to: load_test_results.txt

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOKEN="${TOKEN:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.REPLACE_WITH_REAL_TOKEN}"
RESULTS_FILE="load_test_results.txt"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════" | tee "$RESULTS_FILE"
echo " Eduplexo Load Test — $(date)" | tee -a "$RESULTS_FILE"
echo " Target: $BASE_URL" | tee -a "$RESULTS_FILE"
echo "═══════════════════════════════════════════════════════════════" | tee -a "$RESULTS_FILE"

# Check hey is installed
if ! command -v hey &> /dev/null; then
    echo -e "${RED}ERROR: 'hey' not installed. Run: brew install hey${NC}"
    exit 1
fi

# Health check
echo -e "\n${YELLOW}[0/5] Health check...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}Server not healthy (HTTP $HTTP_CODE). Start the server first.${NC}"
    exit 1
fi
echo -e "${GREEN}Server healthy ✓${NC}"

# ─── Test 1: Dashboard (Baseline) ────────────────────────────────────────
echo -e "\n${YELLOW}[1/5] Dashboard — Baseline (50 concurrent, 500 total)${NC}" | tee -a "$RESULTS_FILE"
echo "Expected: P95 < 100ms, 0 errors" | tee -a "$RESULTS_FILE"
echo "---" | tee -a "$RESULTS_FILE"
hey -n 500 -c 50 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/analytics/dashboard" 2>&1 | tee -a "$RESULTS_FILE"

# ─── Test 2: Dashboard (Stress) ──────────────────────────────────────────
echo -e "\n${YELLOW}[2/5] Dashboard — Stress (200 concurrent, 2000 total)${NC}" | tee -a "$RESULTS_FILE"
echo "Expected: P95 < 300ms, error rate < 1%" | tee -a "$RESULTS_FILE"
echo "---" | tee -a "$RESULTS_FILE"
hey -n 2000 -c 200 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/analytics/dashboard" 2>&1 | tee -a "$RESULTS_FILE"

# ─── Test 3: Student List with Pagination ─────────────────────────────────
echo -e "\n${YELLOW}[3/5] Student List — Paginated (100 concurrent, 1000 total)${NC}" | tee -a "$RESULTS_FILE"
echo "Expected: P95 < 50ms" | tee -a "$RESULTS_FILE"
echo "---" | tee -a "$RESULTS_FILE"
hey -n 1000 -c 100 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/students?page=1&per_page=25" 2>&1 | tee -a "$RESULTS_FILE"

# ─── Test 4: Attendance Bulk Mark (POST) ──────────────────────────────────
echo -e "\n${YELLOW}[4/5] Attendance Bulk Mark (50 concurrent, 200 total)${NC}" | tee -a "$RESULTS_FILE"
echo "Expected: P95 < 100ms" | tee -a "$RESULTS_FILE"
echo "---" | tee -a "$RESULTS_FILE"

# Create payload file if it doesn't exist
if [ ! -f "scripts/attendance_payload.json" ]; then
    echo '{"class_id":"cls_1","date":"2026-05-15","period":1,"records":[' > scripts/attendance_payload.json
    for i in $(seq 1 50); do
        [ $i -gt 1 ] && echo -n "," >> scripts/attendance_payload.json
        echo -n "{\"student_id\":\"stu_$i\",\"status\":\"present\"}" >> scripts/attendance_payload.json
    done
    echo ']}' >> scripts/attendance_payload.json
fi

hey -n 200 -c 50 -m POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -D "scripts/attendance_payload.json" \
    "$BASE_URL/api/attendance/mark" 2>&1 | tee -a "$RESULTS_FILE"

# ─── Test 5: Notifications (Cache-heavy) ─────────────────────────────────
echo -e "\n${YELLOW}[5/5] Notifications (200 concurrent, 1000 total)${NC}" | tee -a "$RESULTS_FILE"
echo "Expected: P95 < 30ms (Redis cache)" | tee -a "$RESULTS_FILE"
echo "---" | tee -a "$RESULTS_FILE"
hey -n 1000 -c 200 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/notifications?limit=20" 2>&1 | tee -a "$RESULTS_FILE"

# ─── Summary ─────────────────────────────────────────────────────────────
echo -e "\n═══════════════════════════════════════════════════════════════" | tee -a "$RESULTS_FILE"
echo -e "${GREEN}Load test complete. Results saved to: $RESULTS_FILE${NC}"
echo "═══════════════════════════════════════════════════════════════" | tee -a "$RESULTS_FILE"
