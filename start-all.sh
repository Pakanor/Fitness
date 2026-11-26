#!/usr/bin/env bash
#
# Starts (and stops) every FitnessApp backend microservice at once:
#
#   AuthAPI         http://localhost:5010
#   ExerciseAPI     http://localhost:5185
#   BackendLogicApi http://localhost:5142
#   Gateway (YARP)  http://localhost:8000   <- frontend talks only to this one
#
# Usage:
#   ./start-all.sh              build + start all 4 services (default)
#   ./start-all.sh start        same
#   ./start-all.sh stop         stop everything this script started
#   ./start-all.sh restart      stop, then start again
#   ./start-all.sh status       show which services are up
#   ./start-all.sh logs [name]  tail the service logs
#   ./start-all.sh db           start the 3 Postgres containers (5442/5443/5444)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT/.env"
LOG_DIR="$ROOT/logs"
BACKEND="$ROOT/backend"

# name | csproj | listen url
# Ports are fixed by the architecture (see README) and must not change.
SERVICES=(
  "AuthAPI|AuthAPI/AuthAPI.csproj|http://localhost:5010"
  "ExerciseAPI|ExerciseAPI/ExerciseAPI.csproj|http://localhost:5185"
  "BackendLogicApi|BackendLogicApi/BackendLogicApi.csproj|http://localhost:5142"
  "Gateway|Gateway/FitnessApp.Gateway.csproj|http://localhost:8000"
)

DB_PORTS=(5442 5443 5444)

# ---------------------------------------------------------------- helpers ----

c_reset=$'\033[0m'; c_dim=$'\033[2m'; c_red=$'\033[31m'; c_green=$'\033[32m'; c_yellow=$'\033[33m'; c_blue=$'\033[34m'

log()  { printf '%s==>%s %s\n' "$c_blue" "$c_reset" "$*"; }
ok()   { printf '%s  ok%s  %s\n' "$c_green" "$c_reset" "$*"; }
warn() { printf '%swarn%s  %s\n' "$c_yellow" "$c_reset" "$*" >&2; }
die()  { printf '%serror%s %s\n' "$c_red" "$c_reset" "$*" >&2; exit 1; }

require_env() {
  [ -f "$ENV_FILE" ] || die "Missing $ENV_FILE — create it with: cp '$ROOT/.env.example' '$ENV_FILE' (then fill in DB_PASSWORD, POSTGRES_PASSWORD, RAPIDAPI_KEY)"
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  [ -n "${DB_PASSWORD:-}" ] || die "DB_PASSWORD is empty in $ENV_FILE — AuthAPI/ExerciseAPI/BackendLogicApi fail fast without it."
  DOTNET="$(command -v dotnet || true)"
  [ -n "$DOTNET" ] || [ -x "$HOME/.dotnet/dotnet" ] || die "dotnet not found in PATH (need .NET 9 SDK)."
  DOTNET="${DOTNET:-$HOME/.dotnet/dotnet}"
}

port_busy() { ss -ltn "sport = :$1" 2>/dev/null | grep -q ":$1"; }

wait_for_port() {
  local port="$1" name="$2" tries=60
  while [ "$tries" -gt 0 ]; do
    port_busy "$port" && return 0
    pid_file="$LOG_DIR/$name.pid"
    if [ -f "$pid_file" ] && ! kill -0 "$(cat "$pid_file")" 2>/dev/null; then
      return 1
    fi
    sleep 1
    tries=$((tries - 1))
  done
  return 1
}

service_pid() {
  local name="$1" f="$LOG_DIR/$name.pid"
  [ -f "$f" ] || return 1
  local pid; pid="$(cat "$f" 2>/dev/null || true)"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && { echo "$pid"; return 0; }
  return 1
}

start_service() {
  local name="$1" project="$2" url="$3"
  local port="${url##*:}"
  local log_file="$LOG_DIR/$name.log"

  if pid="$(service_pid "$name")"; then
    warn "$name already running (pid $pid)"
    return 0
  fi

  if port_busy "$port"; then
    warn "port $port already in use, skipping $name (something else holds it)"
    return 0
  fi

  log "starting $name on port $port ..."
  : >"$log_file"

  # No launch profile: the http profile sets launchBrowser, which would open four
  # browser tabs. The listen address is passed explicitly instead.
  export DOTNET_NOLOGO=1 DOTNET_CLI_TELEMETRY_OPTOUT=1
  export ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS="$url"

  ( cd "$BACKEND" && exec "$DOTNET" run --project "$project" --no-launch-profile ) >>"$log_file" 2>&1 &
  echo $! >"$LOG_DIR/$name.pid"

  if wait_for_port "$port" "$name"; then
    ok "$name listening on $url ${c_dim}(log: ${log_file#$ROOT/})${c_reset}"
  else
    warn "$name did not open port $port — last log lines:"
    tail -n 15 "$log_file" >&2 || true
    return 1
  fi
}

stop_service() {
  local name="$1"
  if pid="$(service_pid "$name")"; then
    log "stopping $name (pid $pid) ..."
    # dotnet run spawns the app as a child, so kill the whole process group.
    pkill -TERM -P "$pid" 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    if kill -0 "$pid" 2>/dev/null; then
      pkill -KILL -P "$pid" 2>/dev/null || true
      kill -KILL "$pid" 2>/dev/null || true
    fi
    ok "$name stopped"
  else
    ok "$name not running"
  fi
  rm -f "$LOG_DIR/$name.pid"
}

status() {
  printf '%-15s %-6s %-9s %s\n' SERVICE PORT STATE PID
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name _ url <<<"$entry"
    local port="${url##*:}"
    local_state="down"; pid_state="-"
    if pid="$(service_pid "$name")"; then
      local_state="UP"; pid_state="$pid"
    elif port_busy "$port"; then
      local_state="UP(?)"; pid_state="foreign"
    fi
    if [ "$local_state" = "UP" ]; then
      printf '%-15s %-6s %s%-9s%s %s\n' "$name" "$port" "$c_green" "$local_state" "$c_reset" "$pid_state"
    else
      printf '%-15s %-6s %s%-9s%s %s\n' "$name" "$port" "$c_dim" "$local_state" "$c_reset" "$pid_state"
    fi
  done
}

db_warn() {
  local missing=0
  for p in "${DB_PORTS[@]}"; do
    port_busy "$p" || { warn "Postgres port $p is not listening"; missing=1; }
  done
  [ "$missing" = 1 ] && warn "Start the databases with: ./start-all.sh db   (docker compose up -d db_auth db_exercise db_products)"
  return 0
}

start_all() {
  require_env
  mkdir -p "$LOG_DIR"

  log "building backend services ..."
  # Only the 4 microservices: Programowanie.sln also contains the WPF desktop
  # client, which cannot build on Linux/macOS.
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r _ project _ <<<"$entry"
    ( cd "$BACKEND" && "$DOTNET" build "$project" -v quiet --nologo )
  done

  log "starting 4 backend microservices ..."
  local failed=0
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name project url <<<"$entry"
    start_service "$name" "$project" "$url" || failed=1
  done

  db_warn

  echo
  if [ "$failed" = 1 ]; then
    warn "some services failed to start — see logs with: ./start-all.sh logs"
  else
    ok "backend up. Gateway: http://localhost:8000  (Swagger: http://localhost:8000/swagger)"
  fi
  echo "  frontend talks to the gateway only — point it at http://localhost:8000"
  echo "  stop everything with: ./start-all.sh stop"
  echo
}

case "${1:-start}" in
  start)   start_all ;;
  stop)
    for entry in "${SERVICES[@]}"; do IFS='|' read -r name _ _ <<<"$entry"; stop_service "$name"; done
    echo "logs kept in ${LOG_DIR#$ROOT/}/"
    ;;
  restart)
    "$0" stop
    "$0" start
    ;;
  status)
    mkdir -p "$LOG_DIR"
    status
    ;;
  db)
    require_env
    log "starting Postgres containers (auth 5442, exercise 5443, products 5444) ..."
    cd "$ROOT" && docker compose up -d db_auth db_exercise db_products
    ;;
  logs)
    mkdir -p "$LOG_DIR"
    if [ -n "${2:-}" ]; then
      exec tail -f "$LOG_DIR/$2.log"
    fi
    for entry in "${SERVICES[@]}"; do IFS='|' read -r name _ _ <<<"$entry"; echo "--- $name ---"; tail -n 5 "$LOG_DIR/$name.log" 2>/dev/null || echo "(no log)"; done
    ;;
  *)
    echo "Usage: $0 <start|stop|restart|status|logs [service]|db>" >&2
    exit 1
    ;;
esac
