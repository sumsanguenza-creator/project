# Student Registration System

Full-stack starter project using React + Vite, FastAPI, SQLAlchemy, and PostgreSQL.

## Features
- List students
- Add/create student
- Search by student ID, name, or email
- Delete with confirmation
- Basic form validation and duplicate email/student ID handling
- PostgreSQL persistence
- Interactive API docs at `/docs`

## Pages / routes
- `/` — dashboard with summary and student list
- `/students` — student list and search
- `/students/new` — add student form

The starter keeps the dashboard/list experience simple; React Router handles the page routes.

## User flow diagram

```mermaid
flowchart TD
    A([Start]) --> B[Open Student Dashboard]
    B --> C[Load students from FastAPI]
    C --> D{Choose action}
    D -->|View all| E[Student List]
    E --> F[Search by ID, name, or email]
    F --> G[Show matching records]
    G --> D
    D -->|Add student| H[Open Add Student form]
    H --> I[Enter student details]
    I --> J{Valid input?}
    J -->|No| K[Show validation errors]
    K --> I
    J -->|Yes| L[POST student to FastAPI]
    L --> M{Saved successfully?}
    M -->|No| N[Show API/database error]
    N --> I
    M -->|Yes| O[Refresh student list]
    O --> D
    D -->|Delete student| P[Confirm deletion]
    P -->|Cancel| D
    P -->|Confirm| Q[DELETE request to FastAPI]
    Q --> R[Refresh list and show result]
    R --> D
```

## Requirements
- Python 3.10+
- Node.js 18+
- Docker Desktop (recommended) or local PostgreSQL

## Quick start with Docker PostgreSQL

### 1. Start PostgreSQL
From the project root:

```bash
docker compose up -d db
```

This starts PostgreSQL on port `5432` with:
- Database: `student_db`
- Username: `postgres`
- Password: `postgres`

### 2. Start FastAPI backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`; docs at `http://localhost:8000/docs`.

If you use a local database, set `DATABASE_URL` before starting the backend. Example:
`postgresql+psycopg://postgres:postgres@localhost:5432/student_db`

### 3. Start React frontend
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | List students; optional `?search=...` |
| POST | `/api/students` | Create a student |
| GET | `/api/students/{id}` | Get one student |
| DELETE | `/api/students/{id}` | Delete a student |

## Student data fields
- `student_id` (required, unique)
- `full_name` (required)
- `email` (required, unique)
- `phone` (optional)
- `course` (required)
- `year_level` (required, 1–6)

## Notes
- This is an educational starter, not a production-ready school information system.
- Before deployment, add authentication/authorization, audit logging, migrations (Alembic), pagination, stronger rate limiting, HTTPS, backups, and secrets management.
- Deleting is permanent in this starter. Confirm before deleting.
