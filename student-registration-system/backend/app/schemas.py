
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudentCreate(BaseModel):
    student_id: str = Field(min_length=1, max_length=30)
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    course: str = Field(min_length=1, max_length=120)
    year_level: int = Field(ge=1, le=6)


class StudentUpdate(BaseModel):
    student_id: str = Field(min_length=1, max_length=30)
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    course: str = Field(min_length=1, max_length=120)
    year_level: int = Field(ge=1, le=6)


class StudentRead(StudentCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
