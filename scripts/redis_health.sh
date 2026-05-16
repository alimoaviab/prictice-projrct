#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Eduplexo Redis Health Check Script
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/redis_health.sh [redis-host] [redis-port]

set -euo pipefail

REDIS_HOST="${1:-localhost}"
REDIS_PORT="${2:-6379}"
REDIS_CLI="redis-cli -h $REDIS_HOST -p $REDIS_PORT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo " Redis Health Report — $(date)"
echo " Host: $REDIS_HOST:$REDIS_PORT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. Memory Usage ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/7] Memory Usage${NC}"
USED_MEMORY=$($REDIS_CLI INFO memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
MAX_MEMORY=$($REDIS_CLI CONFIG GET maxmemory | tail -1 | tr -d '\r')
FRAG_RATIO=$($REDIS_CLI INFO memory | grep "mem_fragmentation_ratio" | cut -d: -f2 | tr -d '\r')

echo "  Used memory:        $USED_MEMORY"
echo "  Max memory:         $(echo "$MAX_MEMORY" | awk '{printf "%.0fMB", $1/1024/1024}')"
echo "  Fragmentation ratio: $FRAG_RATIO"

if (( $(echo "$FRAG_RATIO > 1.5" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "  ${RED}⚠ High fragmentation (>1.5) — consider MEMORY PURGE${NC}"
fi

# ─── 2. Cache Hit Rate ───────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/7] Cache Hit Rate${NC}"
HITS=$($REDIS_CLI INFO stats | grep "keyspace_hits" | cut -d: -f2 | tr -d '\r')
MISSES=$($REDIS_CLI INFO stats | grep "keyspace_misses" | cut -d: -f2 | tr -d '\r')

if [ "$((HITS + MISSES))" -gt 0 ]; then
    HIT_RATE=$(echo "scale=1; $HITS * 100 / ($HITS + $MISSES)" | bc)
    echo "  Hits:     $HITS"
    echo "  Misses:   $MISSES"
    echo "  Hit rate: ${HIT_RATE}%"
    
    if (( $(echo "$HIT_RATE < 70" | bc -l) )); then
        echo -e "  ${RED}⚠ Hit rate below 70% — check TTLs and cache strategy${NC}"
    else
        echo -e "  ${GREEN}✓ Hit rate healthy${NC}"
    fi
else
    echo "  No keyspace activity yet"
fi

# ─── 3. Connected Clients ────────────────────────────────────────────────
echo -e "\n${YELLOW}[3/7] Connected Clients${NC}"
CLIENTS=$($REDIS_CLI INFO clients | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
echo "  Connected: $CLIENTS"

# ─── 4. Keys by Pattern ──────────────────────────────────────────────────
echo -e "\n${YELLOW}[4/7] Keys by Pattern${NC}"
DASH_KEYS=$($REDIS_CLI EVAL "return #redis.call('keys','dash:*')" 0 2>/dev/null || echo "0")
STU_KEYS=$($REDIS_CLI EVAL "return #redis.call('keys','students:*')" 0 2>/dev/null || echo "0")
ATT_KEYS=$($REDIS_CLI EVAL "return #redis.call('keys','att:*')" 0 2>/dev/null || echo "0")
FEE_KEYS=$($REDIS_CLI EVAL "return #redis.call('keys','fees:*')" 0 2>/dev/null || echo "0")
JOB_KEYS=$($REDIS_CLI EVAL "return #redis.call('keys','job:*')" 0 2>/dev/null || echo "0")
TOTAL=$($REDIS_CLI DBSIZE | awk '{print $2}' | tr -d '\r')

echo "  dash:*      $DASH_KEYS keys"
echo "  students:*  $STU_KEYS keys"
echo "  att:*       $ATT_KEYS keys"
echo "  fees:*      $FEE_KEYS keys"
echo "  job:*       $JOB_KEYS keys"
echo "  TOTAL:      $TOTAL keys"

# ─── 5. Eviction Count ───────────────────────────────────────────────────
echo -e "\n${YELLOW}[5/7] Evictions${NC}"
EVICTIONS=$($REDIS_CLI INFO stats | grep "evicted_keys" | cut -d: -f2 | tr -d '\r')
echo "  Evicted keys: $EVICTIONS"
if [ "$EVICTIONS" != "0" ]; then
    echo -e "  ${YELLOW}⚠ Keys being evicted — consider increasing maxmemory${NC}"
else
    echo -e "  ${GREEN}✓ No evictions${NC}"
fi

# ─── 6. Slowlog ──────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[6/7] Slow Commands (>10ms)${NC}"
$REDIS_CLI SLOWLOG GET 10 | head -40
echo ""

# ─── 7. Top Biggest Keys ─────────────────────────────────────────────────
echo -e "\n${YELLOW}[7/7] Biggest Keys${NC}"
$REDIS_CLI --bigkeys 2>/dev/null | grep -A1 "Biggest" | head -20

echo -e "\n═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}Redis health check complete.${NC}"
