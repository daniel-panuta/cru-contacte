from __future__ import annotations

from config import settings
from database import SessionLocal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middleware import hash_password
from models import User
from routers.admin import router as admin_router
from routers.auth import router as auth_router
from routers.contacts import router as contacts_router
from sqlalchemy import select

app = FastAPI(title="CRM Contacte API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(admin_router)


def ensure_default_admin() -> None:
    session = SessionLocal()
    try:
        existing_admin = session.scalar(select(User).where(User.email == settings.admin_email))
        if existing_admin:
            return

        session.add(
            User(
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                name=settings.admin_name,
                role="admin",
            )
        )
        session.commit()
    finally:
        session.close()


@app.on_event("startup")
def startup() -> None:
    ensure_default_admin()
