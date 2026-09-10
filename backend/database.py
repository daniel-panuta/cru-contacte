from __future__ import annotations

from config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine_kwargs = {"pool_pre_ping": True}

if not settings.database_url.startswith("sqlite"):
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 50

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
