#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

stop_pidfile() {
  local name="$1"; local file="$2"
  if [[ -f "$file" ]]; then
    local pid
    pid="$(cat "$file" || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "[stop] Killing $name PID $pid"
      kill "$pid" || true
    fi
    rm -f "$file"
  fi
}

echo "[stop] Stopping frontend (vite) if running"
stop_pidfile frontend "$ROOT_DIR/frontend.pid"
pkill -f 'vite' >/dev/null 2>&1 || true

echo "[stop] Stopping backend (uvicorn) if running"
stop_pidfile backend "$ROOT_DIR/backend/uvicorn.pid"
pkill -f 'uvicorn main:app' >/dev/null 2>&1 || true

echo "[stop] Done"
