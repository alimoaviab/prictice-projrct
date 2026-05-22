#!/usr/bin/env bash
# Helper to recover from Docker Hub pull timeouts on macOS.
#
# Symptoms it addresses:
#   "failed to do request: Head https://registry-1.docker.io/...:
#    context deadline exceeded"
#
# Usage:  bash scripts/fix-docker-pull.sh
#
# What it does:
#   1. Pings Docker Hub from the host (sanity check).
#   2. Pre-pulls every base image used in the compose file one-by-one
#      with a generous timeout, so the actual `docker compose up --build`
#      never has to fetch metadata under load.
#   3. Falls back to a slower retry loop if a pull fails.
set -uo pipefail

IMAGES=(
  "golang:alpine"
  "gcr.io/distroless/static-debian12:nonroot"
  "node:22-alpine"
  "nginx:1.27-alpine"
  "python:3.12-slim"
  "postgres:16-alpine"
  "redis:7-alpine"
)

echo "── 1. Host reachability check ──────────────────────────────────"
if curl -sI --max-time 8 https://registry-1.docker.io/v2/ | head -1; then
  echo "Host can reach Docker Hub."
else
  echo "Host CANNOT reach Docker Hub. Check Wi-Fi / VPN / DNS first."
  exit 1
fi

echo
echo "── 2. Docker daemon check ──────────────────────────────────────"
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon not running. Start Docker Desktop and re-run."
  exit 1
fi

echo
echo "── 3. Pre-pulling base images (with retries) ───────────────────"

# Use gtimeout if available (macOS with GNU coreutils), else use timeout (Linux)
TIMEOUT_CMD="timeout"
if ! command -v timeout &> /dev/null; then
  if command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout"
  else
    echo "Warning: timeout/gtimeout not found. Pulling without timeout."
    TIMEOUT_CMD=""
  fi
fi

for img in "${IMAGES[@]}"; do
  echo
  echo "→ ${img}"
  for attempt in 1 2 3; do
    if [ -z "$TIMEOUT_CMD" ]; then
      docker pull "$img" && echo "  ok" && break
    else
      $TIMEOUT_CMD 180 docker pull "$img" && echo "  ok" && break
    fi
    echo "  attempt ${attempt} failed, retrying in 5s…"
    sleep 5
  done
done

echo
echo "── 4. Done ─────────────────────────────────────────────────────"
echo "Now run: docker compose up -d --build"
