#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

MODE="local"
INSTALL_DEPS="false"

usage() {
  cat <<'EOF'
Usage: ./run_app.sh [--local|--docker] [--install]

Options:
  --local     Run backend + frontend directly on host (default)
  --docker    Run with docker compose
  --install   Install backend/frontend dependencies before start
  --help      Show this help

Environment overrides:
  BACKEND_HOST, BACKEND_PORT, FRONTEND_HOST, FRONTEND_PORT

URLs after start:
  Frontend: http://127.0.0.1:5173
  Backend:  http://127.0.0.1:8000/docs
EOF
}

log() {
  printf '[run_app] %s\n' "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '[run_app] Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

for arg in "$@"; do
  case "$arg" in
    --local)
      MODE="local"
      ;;
    --docker)
      MODE="docker"
      ;;
    --install)
      INSTALL_DEPS="true"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf '[run_app] Unknown option: %s\n' "$arg" >&2
      usage
      exit 1
      ;;
  esac
done

start_docker() {
  require_cmd docker

  if docker compose version >/dev/null 2>&1; then
    log "Starting app with docker compose"
    cd "$ROOT_DIR"
    docker compose up --build
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    log "Starting app with docker-compose"
    cd "$ROOT_DIR"
    docker-compose up --build
    return
  fi

  printf '[run_app] docker compose is not available. Install Docker Compose v2 or docker-compose.\n' >&2
  exit 1
}

start_local() {
  require_cmd python3
  require_cmd npm

  if [[ ! -f "$BACKEND_DIR/.env.backend" ]]; then
    printf '[run_app] Missing backend/.env.backend. Configure DATABASE_URL and retry.\n' >&2
    exit 1
  fi

  if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    log "Creating backend virtual environment"
    python3 -m venv "$BACKEND_DIR/.venv"
  fi

  if [[ "$INSTALL_DEPS" == "true" ]]; then
    log "Installing backend dependencies"
    "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"

    log "Installing frontend dependencies"
    cd "$FRONTEND_DIR"
    npm install
  fi

  if [[ ! -f "$FRONTEND_DIR/.env.local" ]]; then
    log "Creating frontend/.env.local"
    printf 'VITE_API_URL="http://%s:%s"\n' "$BACKEND_HOST" "$BACKEND_PORT" > "$FRONTEND_DIR/.env.local"
  fi

  log "Running Alembic migrations"
  (
    cd "$BACKEND_DIR"
    "$BACKEND_DIR/.venv/bin/alembic" upgrade head
  )

  log "Starting backend on http://$BACKEND_HOST:$BACKEND_PORT"
  (
    cd "$BACKEND_DIR"
    exec "$BACKEND_DIR/.venv/bin/uvicorn" main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload
  ) &
  BACKEND_PID=$!

  log "Starting frontend on http://$FRONTEND_HOST:$FRONTEND_PORT"
  (
    cd "$FRONTEND_DIR"
    exec npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
  ) &
  FRONTEND_PID=$!

  cleanup() {
    log "Stopping processes"
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  }

  trap cleanup INT TERM EXIT

  log "Application is running"
  log "Frontend: http://$FRONTEND_HOST:$FRONTEND_PORT"
  log "Backend docs: http://$BACKEND_HOST:$BACKEND_PORT/docs"

  wait "$BACKEND_PID" "$FRONTEND_PID"
}

if [[ "$MODE" == "docker" ]]; then
  start_docker
else
  start_local
fi
