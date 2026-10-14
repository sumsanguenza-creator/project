from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Student
from .schemas import StudentCreate, StudentRead

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Student Registration API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


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


@app.get("/api/students/{student_pk}", response_model=StudentRead)
def get_student(student_pk: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.post("/api/students", response_model=StudentRead, status_code=201)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
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


@app.delete("/api/students/{student_pk}", status_code=204)
def delete_student(student_pk: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return Response(status_code=204)
