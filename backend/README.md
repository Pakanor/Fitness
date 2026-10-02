```md

# FitnessApp Backend

ASP.NET Core backend microservices for FitnessApp. Handles authentication, exercise management, and product/calorie tracking.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Database Setup](#database-setup)
- [Future Improvements](#future-improvements coming) 

## Architecture

The backend uses a YARP API Gateway that routes requests to microservices:


YARP Gateway (Port 8000) - API Gateway & Routing
AuthAPI (Port 5010) - User Authentication
ExerciseAPI (Port 5185) - Exercise Database & Logs
BackendLogicApi (Port 5142)- Product & Calorie Tracking


Each service has its own PostgreSQL database and runs independently.

### Microservice Flow


Frontend → YARP Gateway → AuthAPI → JWT validation
Frontend → YARP Gateway → ExerciseAPI → Log exercises
Frontend → YARP Gateway → BackendLogicApi → Log products / calculate calories


## Tech Stack

- ASP.NET Core 9
- YARP Reverse Proxy
- Entity Framework Core 9
- PostgreSQL 12+
- JWT Authentication (HttpOnly Cookies)
- Swagger/OpenAPI
- FluentValidation

## Project Structure


fitness-app/
├── backend/
│ ├── Gateway/
│ │ ├── Program.cs
│ │ └── appsettings.json
│ ├── AuthAPI/
│ │ ├── Controllers/
│ │ ├── Services/
│ │ ├── DataAccess/
│ │ └── Program.cs
│ ├── ExerciseAPI/
│ │ ├── Controllers/
│ │ ├── Services/
│ │ ├── Models/
│ │ └── Program.cs
│ └── BackendLogicApi/
│   ├── Controllers/
│   ├── Services/
│   ├── Models/
│   └── Program.cs


## Installation

### Prerequisites

- .NET 9
- PostgreSQL 12+

### Setup Services

```bash
cd backend/Gateway
dotnet run

cd backend/AuthAPI
dotnet restore
dotnet ef database update
dotnet run

Repeat for ExerciseAPI and BackendLogicApi after configuring appsettings.json for each database.

Database Setup

Create three databases for each service:

CREATE USER fitnessapp WITH PASSWORD 'your_password';
CREATE DATABASE auth OWNER fitnessapp;
CREATE DATABASE exercise OWNER fitnessapp;
CREATE DATABASE products OWNER fitnessapp;
GRANT ALL PRIVILEGES ON DATABASE auth TO fitnessapp;
GRANT ALL PRIVILEGES ON DATABASE exercise TO fitnessapp;
GRANT ALL PRIVILEGES ON DATABASE products TO fitnessapp;
API Documentation

Swagger UI is available for each service:

Gateway: http://localhost:8000
AuthAPI: http://localhost:5010/swagger
ExerciseAPI: http://localhost:5185/swagger
BackendLogicApi: http://localhost:5142/swagger

Endpoints cover registration, login, exercise CRUD, product logging, and calorie calculations.

Authentication
JWT token-based with HttpOnly cookies
Token stored as __Host-FitnessApp-Auth cookie
Token expiration: 60 minutes
Secret key configured in appsettings.json
Future Improvements
Dockerize all services
Environment variable management
CI/CD pipeline
Advanced analytics & social features