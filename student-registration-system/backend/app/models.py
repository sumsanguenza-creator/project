from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    course: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    year_level: Mapped[int] = mapped_column(Integer, nullable=False)
