from __future__ import annotations

from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILES = (str(ROOT_DIR / ".env.backend"), str(BACKEND_DIR / ".env.backend"))


def normalize_database_url(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return raw

    if raw.startswith("sqlite"):
        return raw

    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw.startswith("postgresql://") and "+psycopg2" not in raw:
        raw = raw.replace("postgresql://", "postgresql+psycopg2://", 1)

    return raw.replace("ssl=require", "sslmode=require")


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "replace-with-strong-random-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    admin_email: str = "admin@crmcontacte.local"
    admin_password: str = "replace-with-strong-admin-password"
    admin_name: str = "System Admin"

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_db_url(cls, value: str) -> str:
        return normalize_database_url(value)


settings = Settings()
