
from getpass import getpass

from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.database import engine
from backend.app.models import StudentAccount

password_hash = PasswordHash.recommended()

student_id = "BSIT-2026-002"

new_password = getpass("Enter new password (at least 8 characters): ")
confirm_password = getpass("Confirm new password: ")

if len(new_password) < 8:
    raise SystemExit("Password must be at least 8 characters.")

if new_password != confirm_password:
    raise SystemExit("Passwords do not match.")

with Session(engine) as db:
    account = db.scalar(
        select(StudentAccount).where(
            StudentAccount.student_id == student_id
        )
    )

    if account is None:
        raise SystemExit("Student account not found.")

    account.password_hash = password_hash.hash(new_password)
    db.commit()

print("Password reset successful!")
