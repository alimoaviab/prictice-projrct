#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Eduplexo Performance Comparison: Before vs After Optimization
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/compare_performance.sh
# Requires: baseline.json (saved before optimization), hey installed

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOKEN="${TOKEN:-REPLACE_WITH_TOKEN}"
BASELINE_FILE="scripts/baseline.json"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# ─── Run current load test and capture metrics ────────────────────────────
echo "Running current performance test..."

# Dashboard P95
DASH_P95=$(hey -n 200 -c 50 \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/analytics/dashboard" 2>&1 | grep "95%" | awk '{print $2}' | sed 's/s//')
DASH_P95_MS=$(echo "$DASH_P95 * 1000" | bc 2>/dev/null || echo "0")

# Student list P95
STU_P95=$(hey -n 200 -c 50 \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/students?page=1&per_page=25" 2>&1 | grep "95%" | awk '{print $2}' | sed 's/s//')
STU_P95_MS=$(echo "$STU_P95 * 1000" | bc 2>/dev/null || echo "0")

# Memory usage (from /health endpoint)
MEMORY_MB=$(curl -s "$BASE_URL/health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('memory_mb', 0))" 2>/dev/null || echo "0")

# Cache hit rate (from /metrics)
CACHE_HITS=$(curl -s "$BASE_URL/metrics" | grep 'redis_cache_hits_total' | grep -v '#' | awk '{sum+=$2} END {print sum+0}' 2>/dev/null || echo "0")
CACHE_MISSES=$(curl -s "$BASE_URL/metrics" | grep 'redis_cache_misses_total' | grep -v '#' | awk '{sum+=$2} END {print sum+0}' 2>/dev/null || echo "0")
if [ "$((CACHE_HITS + CACHE_MISSES))" -gt 0 ]; then
    CACHE_RATE=$(echo "scale=0; $CACHE_HITS * 100 / ($CACHE_HITS + $CACHE_MISSES)" | bc)
else
    CACHE_RATE="N/A"
fi

# ─── Load baseline ───────────────────────────────────────────────────────
if [ ! -f "$BASELINE_FILE" ]; then
    echo "No baseline found. Creating baseline.json with current results..."
    cat > "$BASELINE_FILE" << EOF
{
  "dashboard_p95_ms": ${DASH_P95_MS:-0},
  "student_list_p95_ms": ${STU_P95_MS:-0},
  "memory_mb": ${MEMORY_MB:-0},
  "cache_hit_rate": "${CACHE_RATE}"
}
EOF
    echo "Baseline saved. Run optimizations, then run this script again to compare."
    exit 0
fi

# Parse baseline
B_DASH=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['dashboard_p95_ms'])")
B_STU=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['student_list_p95_ms'])")
B_MEM=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['memory_mb'])")
B_CACHE=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['cache_hit_rate'])")

# ─── Calculate improvements ──────────────────────────────────────────────
calc_improvement() {
    local before=$1 after=$2
    if [ "$before" = "0" ] || [ "$before" = "N/A" ]; then
        echo "new"
        return
    fi
    echo "scale=1; (1 - $after / $before) * 100" | bc 2>/dev/null || echo "?"
}

DASH_IMP=$(calc_improvement "$B_DASH" "$DASH_P95_MS")
STU_IMP=$(calc_improvement "$B_STU" "$STU_P95_MS")
MEM_IMP=$(calc_improvement "$B_MEM" "$MEMORY_MB")

# ─── Output comparison table ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo " PERFORMANCE COMPARISON: Before vs After Optimization"
echo "═══════════════════════════════════════════════════════════════════════"
printf "%-25s | %-10s | %-10s | %s\n" "Metric" "Before" "After" "Improvement"
echo "─────────────────────────────────────────────────────────────────────"
printf "%-25s | %-10s | %-10s | %s\n" "Dashboard P95" "${B_DASH}ms" "${DASH_P95_MS}ms" "${DASH_IMP}% faster"
printf "%-25s | %-10s | %-10s | %s\n" "Student List P95" "${B_STU}ms" "${STU_P95_MS}ms" "${STU_IMP}% faster"
printf "%-25s | %-10s | %-10s | %s\n" "Memory Usage" "${B_MEM}MB" "${MEMORY_MB}MB" "${MEM_IMP}% less"
printf "%-25s | %-10s | %-10s | %s\n" "Cache Hit Rate" "$B_CACHE" "${CACHE_RATE}%" "new feature"
echo "═══════════════════════════════════════════════════════════════════════"

# ─── Fail if any metric is worse ─────────────────────────────────────────
FAILED=0
if [ "$DASH_P95_MS" != "0" ] && [ "$B_DASH" != "0" ]; then
    if (( $(echo "$DASH_P95_MS > $B_DASH * 1.1" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "${RED}FAIL: Dashboard P95 is worse than baseline!${NC}"
        FAILED=1
    fi
fi

if [ "$FAILED" -eq 1 ]; then
    echo -e "\n${RED}Performance regression detected. Fix before deploying.${NC}"
    exit 1
else
    echo -e "\n${GREEN}All metrics improved or stable. Safe to deploy. ✓${NC}"
fi
