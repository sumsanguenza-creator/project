
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load the .env file from the backend folder.
BACKEND_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV)

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
print("ENV file exists:", BACKEND_ENV.exists())
print("Gemini API key loaded:", bool(API_KEY))
print("Gemini model:", MODEL_NAME)
client = genai.Client(api_key=API_KEY) if API_KEY else None

SYSTEM_INSTRUCTION = """
You are CampusDesk AI, the AI assistant for a Student Registration System.

CampusDesk features include:
- Admin login and dashboard
- Student registration, listing, searching, editing, and deletion
- Student account registration and login
- Student dashboard
- Viewing personal class schedules
- Viewing personal grades
- Admin management of student grades and class schedules
- AI assistance for portal questions

Answer the user's actual question directly. Do not give the same
generic answer to every question.

Use simple English or Filipino depending on the user's language.
Give clear, concise instructions about how to use CampusDesk.

Never invent actual student records, grades, or schedules.
You cannot access the database unless relevant information is
explicitly provided to you. For private student information,
tell the student to log in and check their own portal.
"""

def get_ai_reply(message: str) -> str:
    """Generate an AI reply using Google Gemini."""

    if not isinstance(message, str) or not message.strip():
        return "Please enter a question."

    if client is None:
        return (
            "CampusDesk AI is not configured. "
            "Please check the Gemini API key in the backend .env file."
        )

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=message.strip(),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.4,
                max_output_tokens=500,
            ),
        )

        answer = response.text

        if answer and answer.strip():
            return answer.strip()

        return "I couldn't generate a response. Please try again."

    except Exception as exc:
        # Log the error on the backend, not in the student-facing reply.
        print(f"Gemini API error: {type(exc).__name__}: {exc}")
        return (
            "CampusDesk AI is temporarily unavailable. "
            "Please check the backend logs or try again later."
        )
