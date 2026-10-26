import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pwdlib import PasswordHash
from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Admin, Student, StudentAccount
from .schemas import StudentCreate, StudentRead, StudentUpdate
from .ai_chat import get_ai_reply
# Password hashing
password_hash = PasswordHash.recommended()


# JWT configuration
load_dotenv(Path(__file__).resolve().parent / ".env")

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 30


# Login request schema
class AdminLogin(BaseModel):
    username: str
    password: str

class StudentRegister(BaseModel):
    student_id: str
    email: str
    password: str


class StudentLogin(BaseModel):
    student_id: str
    password: str


class GradeCreate(BaseModel):
    student_pk: int
    subject_code: str
    subject_name: str
    units: int = 3
    prelim: float | None = None
    midterm: float | None = None
    final_grade: float | None = None


class ScheduleCreate(BaseModel):
    student_pk: int
    subject_code: str
    subject_name: str
    day: str
    start_time: str
    end_time: str
    room: str
    instructor: str



# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Add the registration timestamp to existing databases without deleting records.
# Existing rows receive the migration time; new rows receive their actual creation time.
with engine.begin() as connection:
    connection.execute(text(
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP"
    ))


# Create tables for student grades and class schedules.
with engine.begin() as connection:
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS student_grades (
            id SERIAL PRIMARY KEY,
            student_pk INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_code VARCHAR(30) NOT NULL,
            subject_name VARCHAR(150) NOT NULL,
            units INTEGER NOT NULL DEFAULT 3,
            prelim NUMERIC(4,2),
            midterm NUMERIC(4,2),
            final_grade NUMERIC(4,2),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """))

    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS class_schedules (
            id SERIAL PRIMARY KEY,
            student_pk INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_code VARCHAR(30) NOT NULL,
            subject_name VARCHAR(150) NOT NULL,
            day VARCHAR(15) NOT NULL,
            start_time VARCHAR(10) NOT NULL,
            end_time VARCHAR(10) NOT NULL,
            room VARCHAR(100) NOT NULL,
            instructor VARCHAR(120) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """))


# Create FastAPI application
app = FastAPI(
    title="Student Registration API",
    version="1.0.0",
)


# Admin login endpoint
@app.post("/api/auth/login")
def admin_login(
    payload: AdminLogin,
    db: Session = Depends(get_db),
):
    admin = db.scalar(
        select(Admin).where(Admin.username == payload.username)
    )

    if admin is None or not password_hash.verify(
        payload.password,
        admin.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    now = datetime.now(timezone.utc)

    token = jwt.encode(
        {
            "sub": str(admin.id),
            "username": admin.username,
            "role": "admin",
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@app.post("/api/auth/student/register", status_code=201)
def student_register(
    payload: StudentRegister,
    db: Session = Depends(get_db),
):
    student_id = payload.student_id.strip()
    email = payload.email.strip().lower()

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long.",
        )

    student = db.scalar(
        select(Student).where(
            Student.student_id == student_id,
            func.lower(Student.email) == email,
        )
    )

    if student is None:
        raise HTTPException(
            status_code=400,
            detail="Student ID and email do not match an existing student record.",
        )

    existing_account = db.scalar(
        select(StudentAccount).where(
            StudentAccount.student_id == student_id
        )
    )

    if existing_account:
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this Student ID.",
        )

    account = StudentAccount(
        student_id=student_id,
        password_hash=password_hash.hash(payload.password),
    )

    db.add(account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()   
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this Student ID.",
        )

    return {"message": "Student account created successfully."}

@app.post("/api/auth/student/login")
def student_login(
    payload: StudentLogin,
    db: Session = Depends(get_db),
):
    student_id = payload.student_id.strip()

    account = db.scalar(
        select(StudentAccount).where(
            StudentAccount.student_id == student_id
        )
    )

    if account is None or not password_hash.verify(
        payload.password,
        account.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Student ID or password.",
        )

    student = db.scalar(
        select(Student).where(
            Student.student_id == account.student_id
        )
    )

    if student is None:
        raise HTTPException(
            status_code=401,
            detail="Student record not found.",
        )

    now = datetime.now(timezone.utc)

    token = jwt.encode(
        {
            "sub": str(student.id),
            "student_id": student.student_id,
            "role": "student",
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        admin_id = payload.get("sub")
        role = payload.get("role")

        if not admin_id or role != "admin":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    admin = db.get(Admin, int(admin_id))

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Admin account not found",
        )

    return admin


def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        if payload.get("role") != "student":
            raise HTTPException(
                status_code=403,
                detail="Student access only.",
            )

        student_pk = int(payload.get("sub"))

    except HTTPException:
        raise
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    student = db.get(Student, student_pk)

    if student is None:
        raise HTTPException(
            status_code=401,
            detail="Student record not found.",
        )

    return student


@app.get("/api/auth/student/me", response_model=StudentRead)
def get_student_me(
    current_student: Student = Depends(get_current_student),
):
    return current_student



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://student-registration-system-woad-seven.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}

# -------------------------
# STUDENT AI CHAT API
# -------------------------

class ChatRequest(BaseModel):
    message: str



@app.post("/api/student/chat")
def student_ai_chat(
    payload: ChatRequest,
    current_student: Student = Depends(get_current_student),
):
    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please enter a message."
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message must not exceed 2000 characters."
        )

    try:
        reply = get_ai_reply(message)
        return {"reply": reply}

    except Exception as exc:
        print("AI CHAT ERROR:", repr(exc))
        raise HTTPException(
            status_code=502,
            detail="AI assistant is temporarily unavailable. Please try again."
        )


@app.get("/api/students", response_model=list[StudentRead])
def list_students(
    search: str | None = Query(default=None, max_length=120),
    db: Session = Depends(get_db),
):
    stmt = select(Student).order_by(Student.id.desc())
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Student.student_id.ilike(term),
                Student.full_name.ilike(term),
                Student.email.ilike(term),
            )
        )
    return db.scalars(stmt).all()


@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_students = db.scalar(select(func.count()).select_from(Student)) or 0

    course_rows = db.execute(
        select(Student.course, func.count(Student.id))
        .group_by(Student.course)
        .order_by(func.count(Student.id).desc(), Student.course.asc())
    ).all()

    year_rows = db.execute(
        select(Student.year_level, func.count(Student.id))
        .group_by(Student.year_level)
        .order_by(Student.year_level.asc())
    ).all()

    # Return the latest six calendar months, including months with zero registrations.
    now = datetime.now(timezone.utc)
    first_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    months = []
    for offset in range(5, -1, -1):
        month_index = first_month.month - 1 - offset
        year = first_month.year + month_index // 12
        month = month_index % 12 + 1
        start = first_month.replace(year=year, month=month)
        end = start.replace(year=year + 1, month=1) if month == 12 else start.replace(month=month + 1)
        count = db.scalar(
            select(func.count()).select_from(Student).where(
                Student.created_at >= start,
                Student.created_at < end,
            )
        ) or 0
        months.append({"month": start.strftime("%Y-%m"), "label": start.strftime("%b"), "count": count})

    return {
        "total_students": total_students,
        "students_by_course": [{"course": course, "count": count} for course, count in course_rows],
        "students_by_year": [{"year_level": year, "count": count} for year, count in year_rows],
        "monthly_registrations": months,
    }


@app.get("/api/students/{student_pk}", response_model=StudentRead)
def get_student(student_pk: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.post("/api/students", response_model=StudentRead, status_code=201)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    student = Student(**payload.model_dump())
    db.add(student)
    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Student ID or email already exists. Please use unique values.",
        )
    return student



@app.put("/api/students/{student_pk}", response_model=StudentRead)
def update_student(
    student_pk: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_pk)

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Student ID or email already exists. Please use unique values.",
        )

    return student



@app.delete("/api/students/{student_pk}", status_code=204)
def delete_student(
    student_pk: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_pk)

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    db.delete(student)
    db.commit()

    return Response(status_code=204)

    
# -------------------------
# STUDENT GRADES API
# -------------------------

def validate_grade(value: float | None):
    if value is not None and not 1.0 <= value <= 5.0:
        raise HTTPException(
            status_code=400,
            detail="Grades must be between 1.00 and 5.00.",
        )


@app.get("/api/student/grades")
def get_my_grades(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        text("""
            SELECT id, subject_code, subject_name, units,
                   prelim, midterm, final_grade
            FROM student_grades
            WHERE student_pk = :student_pk
            ORDER BY subject_code
        """),
        {"student_pk": current_student.id},
    ).mappings().all()

    return [dict(row) for row in rows]


@app.get("/api/student/schedule")
def get_my_schedule(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        text("""
            SELECT id, subject_code, subject_name, day,
                   start_time, end_time, room, instructor
            FROM class_schedules
            WHERE student_pk = :student_pk
            ORDER BY
                CASE day
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    WHEN 'Saturday' THEN 6
                    WHEN 'Sunday' THEN 7
                    ELSE 8
                END,
                start_time
        """),
        {"student_pk": current_student.id},
    ).mappings().all()

    return [dict(row) for row in rows]


# -------------------------
# ADMIN GRADES MANAGEMENT
# -------------------------

@app.get("/api/admin/grades")
def list_all_grades(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    rows = db.execute(
        text("""
            SELECT g.id, g.student_pk, s.student_id, s.full_name,
                   g.subject_code, g.subject_name, g.units,
                   g.prelim, g.midterm, g.final_grade
            FROM student_grades g
            JOIN students s ON s.id = g.student_pk
            ORDER BY s.full_name, g.subject_code
        """)
    ).mappings().all()

    return [dict(row) for row in rows]


@app.post("/api/admin/grades", status_code=201)
def create_grade(
    payload: GradeCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    validate_grade(payload.prelim)
    validate_grade(payload.midterm)
    validate_grade(payload.final_grade)

    if payload.units < 1 or payload.units > 10:
        raise HTTPException(
            status_code=400,
            detail="Units must be between 1 and 10.",
        )

    if db.get(Student, payload.student_pk) is None:
        raise HTTPException(status_code=404, detail="Student not found.")

    result = db.execute(
        text("""
            INSERT INTO student_grades
                (student_pk, subject_code, subject_name, units,
                 prelim, midterm, final_grade)
            VALUES
                (:student_pk, :subject_code, :subject_name, :units,
                 :prelim, :midterm, :final_grade)
            RETURNING id, student_pk, subject_code, subject_name,
                      units, prelim, midterm, final_grade
        """),
        payload.model_dump(),
    )

    row = result.mappings().one()
    db.commit()

    return dict(row)


@app.delete("/api/admin/grades/{grade_id}", status_code=204)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    result = db.execute(
        text("DELETE FROM student_grades WHERE id = :id"),
        {"id": grade_id},
    )
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(status_code=404, detail="Grade not found.")

    db.commit()
    return Response(status_code=204)


# -------------------------
# ADMIN CLASS SCHEDULE MANAGEMENT
# -------------------------

@app.get("/api/admin/schedules")
def list_all_schedules(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    rows = db.execute(
        text("""
            SELECT c.id, c.student_pk, s.student_id, s.full_name,
                   c.subject_code, c.subject_name, c.day,
                   c.start_time, c.end_time, c.room, c.instructor
            FROM class_schedules c
            JOIN students s ON s.id = c.student_pk
            ORDER BY s.full_name, c.day, c.start_time
        """)
    ).mappings().all()

    return [dict(row) for row in rows]


@app.post("/api/admin/schedules", status_code=201)
def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    allowed_days = {
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
    }

    if payload.day not in allowed_days:
        raise HTTPException(
            status_code=400,
            detail="Invalid day of the week.",
        )

    if payload.start_time >= payload.end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time.",
        )

    if db.get(Student, payload.student_pk) is None:
        raise HTTPException(status_code=404, detail="Student not found.")

    result = db.execute(
        text("""
            INSERT INTO class_schedules
                (student_pk, subject_code, subject_name, day,
                 start_time, end_time, room, instructor)
            VALUES
                (:student_pk, :subject_code, :subject_name, :day,
                 :start_time, :end_time, :room, :instructor)
            RETURNING id, student_pk, subject_code, subject_name,
                      day, start_time, end_time, room, instructor
        """),
        payload.model_dump(),
    )

    row = result.mappings().one()
    db.commit()

    return dict(row)


@app.delete("/api/admin/schedules/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    result = db.execute(
        text("DELETE FROM class_schedules WHERE id = :id"),
        {"id": schedule_id},
    )
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Schedule not found.",
        )

    db.commit()
    return Response(status_code=204)
