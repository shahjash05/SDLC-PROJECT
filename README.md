# Collaborative SDLC Management Platform

This is the greenfield implementation of the Collaborative SDLC Management Platform.

## Stack Overview
- **Backend:** Java 21, Spring Boot 3.4.x, PostgreSQL 16, Flyway
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Infrastructure:** Docker, Docker Compose

---

## Prerequisites
- **Java 21**
- **Node.js** (v20+) & **npm**
- **Docker Desktop** (or equivalent Docker engine)
- **Git**

---

## Quick Start (Windows)

Simply double-click or run:
```cmd
start.bat
```
This automatically starts Docker infrastructure, the Spring Boot backend, and the Vite frontend in dedicated terminal windows. To stop everything, run `stop.bat`.

---

## Setup Instructions

### 1. Environment Variables
Copy the `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
*(On Windows PowerShell, use `Copy-Item .env.example .env`)*

### 2. Start PostgreSQL via Docker
You must start the database before running the backend.
```bash
docker compose -f docker-compose.dev.yml up -d
```
Check that the database is running and healthy:
```bash
docker ps
```

### 3. Start the Backend
Navigate to the `backend` folder:
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
The backend will start on `http://localhost:8081`.
*(Flyway will automatically create the initial database schema upon startup).*

### 4. Start the Frontend
In a new terminal, navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`. Open this URL in your browser to see the Phase 0 landing page.

---

## Testing

**Backend Tests:**
```bash
cd backend
mvn test
```
*(Backend tests run against an in-memory H2 database, so Docker is not required just to run tests).*

**Frontend Tests:**
```bash
cd frontend
npm run test
```

## Production Build

You can run the full stack via Docker using the `full` profile:
```bash
docker compose --profile full up -d --build
```
This will build the Docker images for both backend and frontend and serve them alongside PostgreSQL.

---

**Current Status:** Phase 0 (Foundation) Complete.
