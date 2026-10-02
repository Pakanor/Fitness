# FitnessApp

Fitness tracking application.

## Layout

```text
fitness-app/
├── backend/                  # ASP.NET Core 9 microservices + YARP Gateway
│   ├── Gateway/              # Reverse proxy (port 8000)
│   ├── AuthAPI/              # Authentication (port 5010)
│   ├── ExerciseAPI/          # Exercise database (port 5185)
│   ├── BackendLogicApi/      # Products / calorie logic (port 5142)
│   ├── ExerciseAPI.Tests/
│   ├── Programowanie/        # WPF desktop client
│   └── Programowanie.sln
├── frontend/                 # React 19 + MUI + Framer Motion
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── .vscode/                  # Launch configs and watch tasks (not in repo)
├── docker-compose.yml        # Full stack: 3 APIs, 3 Postgres DBs, frontend
└── README.md
```

`backend` and `frontend` are strictly separated. Do not cross-import assets or
place configuration files outside their respective service directories.

## Service ports

These are fixed by the architecture and must not change without approval.

| Service         | Port |
| --------------- | ---- |
| Gateway (YARP)  | 8000 |
| AuthAPI         | 5010 |
| ExerciseAPI     | 5185 |
| BackendLogicApi | 5142 |

The browser talks only to the Gateway on port 8000. Auth cookies are issued as
`__Host-FitnessApp-Auth`.

## Prerequisites

- .NET 9 SDK
- Node.js 20+ and npm
- Docker + Docker Compose (optional, for the containerised stack)

## Required environment variables

The services read these from the environment — none are hardcoded and none are
committed. Startup fails fast with a clear message if `DB_PASSWORD` is missing.

| Variable            | Used by                                |
| ------------------- | -------------------------------------- |
| `DB_PASSWORD`       | AuthAPI, ExerciseAPI, BackendLogicApi  |
| `RAPIDAPI_KEY`      | ExerciseAPI (exercise/gif import)      |
| `POSTGRES_PASSWORD` | Postgres containers in docker compose |

## Setup

### Backend

```bash
cd backend
dotnet restore
dotnet build
```

Run a single service:

```bash
dotnet run --project Gateway/FitnessApp.Gateway.csproj
```

The APIs need `DB_PASSWORD` in the environment. Easiest is to load `.env`:

```bash
set -a && . ../.env && set +a
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Full stack with Docker

Run from the repository root so the build contexts resolve correctly. Copy the
example env file first — it holds the API key and database password:

```bash
cp .env.example .env    # then fill in the values
docker compose up --build
```

## Documentation

- [`backend/README.md`](./backend/README.md) — microservices detail
- [`frontend/README.md`](./frontend/README.md) — frontend detail

## History

Consolidated from two repositories:

- `https://github.com/Pakanor/FitnessApp` (branch `development`, commit `fcd3e08`)
- `https://github.com/Pakanor/fitness-app-frontend` (branch `development`, commit `4161c5f`)
