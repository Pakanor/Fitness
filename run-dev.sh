#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  echo "Create it from the template:  cp $ROOT/.env.example $ENV_FILE" >&2
  echo "Then fill in DB_PASSWORD, POSTGRES_PASSWORD and RAPIDAPI_KEY." >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

service="${1:-}"

case "$service" in
  gateway)  project="Gateway/FitnessApp.Gateway.csproj" ;;
  auth)     project="AuthAPI/AuthAPI.csproj" ;;
  exercise) project="ExerciseAPI/ExerciseAPI.csproj" ;;
  logic)    project="BackendLogicApi/BackendLogicApi.csproj" ;;
  *)
    echo "Usage: $0 <gateway|auth|exercise|logic>" >&2
    echo "" >&2
    echo "  gateway  -> port 8000" >&2
    echo "  auth     -> port 5010" >&2
    echo "  exercise -> port 5185" >&2
    echo "  logic    -> port 5142" >&2
    exit 1
    ;;
esac

cd "$ROOT/backend"
exec dotnet run --project "$project"
