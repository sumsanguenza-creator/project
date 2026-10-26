
import getpass

from pwdlib import PasswordHash
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Admin

password_hash = PasswordHash.recommended()


def main():
    username = input("Enter existing admin username: ").strip()

    password = getpass.getpass("Enter new password (12+ characters): ")
    confirm_password = getpass.getpass("Confirm new password: ")

    if len(password) < 12:
        print("Password must be at least 12 characters.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    with SessionLocal() as db:
        admin = db.scalar(
            select(Admin).where(Admin.username == username)
        )

        if admin is None:
            print("Admin username not found.")
            return

        admin.password_hash = password_hash.hash(password)
        db.commit()

    print("Admin password updated successfully.")


if __name__ == "__main__":
    main()
