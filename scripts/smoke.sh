#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

log() { printf "[smoke] %s\n" "$*"; }

wait_for_http() {
  local url="$1"; local tries="${2:-40}"; local sleep_s="${3:-0.25}";
  for i in $(seq 1 "$tries"); do
    if curl -fsS -o /dev/null "$url"; then return 0; fi
    sleep "$sleep_s"
  done
  curl -v "$url" || true
  return 1
}

start_backend() {
  log "Starting backend (uvicorn)"
  cd "$BACKEND_DIR"
  # Optional: install deps if venv not present
  if [[ ! -f .venv/bin/activate ]]; then
    python3 -m venv .venv || true
  fi
  # Use system python if venv activation fails silently in non-interactive shells
  pip install -r requirements.txt >/dev/null 2>&1 || true
  nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1 & echo $! > uvicorn.pid
  cd "$ROOT_DIR"
  wait_for_http "http://127.0.0.1:8000/docs" || { log "Backend did not become ready"; exit 1; }
  log "Backend ready on :8000"
}

start_frontend() {
  log "Starting frontend (Vite)"
  cd "$FRONTEND_DIR"
  npm install --no-audit --no-fund >/dev/null 2>&1 || true
  nohup npm run dev -- --host 0.0.0.0 > "$ROOT_DIR/frontend.log" 2>&1 & echo $! > "$ROOT_DIR/frontend.pid"
  cd "$ROOT_DIR"
  wait_for_http "http://127.0.0.1:5173" || { log "Frontend did not become ready"; exit 1; }
  log "Frontend ready on :5173"
}

probe_endpoints() {
  log "Probing frontend index"
  curl -fsS -I http://127.0.0.1:5173 | sed -n '1,5p'

  log "Probing history via Vite proxy (/api/cases)"
  curl -fsS http://127.0.0.1:5173/api/cases | head -c 800 || true; echo

  log "Generating sample case via backend (/api/simulate)"
  curl -fsS -X POST http://127.0.0.1:8000/api/simulate \
    -H 'Content-Type: application/json' \
    -d '{"generate":true, "theme":"Infancia y adolescencia", "difficulty":"medio"}' | head -c 800 || true; echo
}

open_browser() {
  local url="$1"
  if [[ -n "${BROWSER:-}" ]]; then "$BROWSER" "$url" >/dev/null 2>&1 || true; fi
}

log "Smoke test starting"
start_backend
start_frontend
probe_endpoints
log "Opening UI in browser"
open_browser "http://localhost:5173"
log "Smoke test completed"
