from __future__ import annotations

from uuid import UUID

from database import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from middleware import (create_access_token, enforce_rate_limit,
                        get_current_user_from_header, verify_password)
from models import Contact, User
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    contacts_count: int = 0

    @classmethod
    def from_model(cls, user: User, contacts_count: int = 0) -> "UserResponse":
        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            contacts_count=contacts_count,
        )


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


def get_contacts_count(session: Session, user_id: UUID) -> int:
    count = session.scalar(select(func.count(Contact.id)).where(Contact.created_by == user_id))
    return int(count or 0)


@router.post("/login", response_model=LoginResponse)
def login(request: Request, payload: LoginInput, session: Session = Depends(get_session)) -> LoginResponse:
    enforce_rate_limit(request, "auth-login", 10, 60)

    user = session.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": str(user.id)})
    contacts_count = get_contacts_count(session, user.id)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.from_model(user, contacts_count=contacts_count),
    )


@router.get("/me", response_model=UserResponse)
def me(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_header),
) -> UserResponse:
    contacts_count = get_contacts_count(session, current_user.id)
    return UserResponse.from_model(current_user, contacts_count=contacts_count)
