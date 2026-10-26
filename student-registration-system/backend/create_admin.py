import getpass

from pwdlib import PasswordHash
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Admin

password_hash = PasswordHash.recommended()


def main():
    username = input("Enter admin username: ").strip()

    if not username:
        print("Username cannot be empty.")
        return

    password = getpass.getpass("Enter admin password: ")
    confirm_password = getpass.getpass("Confirm admin password: ")

    if len(password) < 12:
        print("Use a password with at least 12 characters.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    with SessionLocal() as db:
        existing_admin = db.scalar(
            select(Admin).where(Admin.username == username)
        )

        if existing_admin:
            print("That admin username already exists.")
            return

        admin = Admin(
            username=username,
            password_hash=password_hash.hash(password),
        )

        db.add(admin)
        db.commit()

    print(f"Admin account '{username}' created successfully.")


if __name__ == "__main__":
    main()
