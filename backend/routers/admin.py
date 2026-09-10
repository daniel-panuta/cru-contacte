from __future__ import annotations

from uuid import UUID

from database import get_session
from fastapi import APIRouter, Depends, HTTPException, status
from middleware import hash_password, verify_admin
from models import Contact, ContactHistory, Log, User
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str

    @classmethod
    def from_model(cls, user: User) -> "AdminUserResponse":
        return cls(id=user.id, email=user.email, name=user.name, role=user.role)


class AdminCreateUserInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str
    name: str
    role: str = "user"


class AdminChangeRoleInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role: str


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    session: Session = Depends(get_session),
    current_admin: User = Depends(verify_admin),
) -> list[AdminUserResponse]:
    del current_admin

    users = session.scalars(select(User).order_by(User.created_at.asc())).all()
    return [AdminUserResponse.from_model(user) for user in users]


@router.post("/users", response_model=AdminUserResponse)
def create_user(
    payload: AdminCreateUserInput,
    session: Session = Depends(get_session),
    current_admin: User = Depends(verify_admin),
) -> AdminUserResponse:
    del current_admin

    role = payload.role.strip().lower()
    if role not in {"admin", "user"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")

    email = payload.email.strip().lower()
    existing_user = session.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        name=payload.name.strip(),
        role=role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return AdminUserResponse.from_model(user)


@router.post("/users/{user_id}/role", response_model=AdminUserResponse)
def change_user_role(
    user_id: UUID,
    payload: AdminChangeRoleInput,
    session: Session = Depends(get_session),
    current_admin: User = Depends(verify_admin),
) -> AdminUserResponse:
    role = payload.role.strip().lower()
    if role not in {"admin", "user"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")

    if current_admin.id == user_id and role != "admin":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot remove your own admin role")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = role
    session.commit()
    session.refresh(user)
    return AdminUserResponse.from_model(user)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: UUID,
    session: Session = Depends(get_session),
    current_admin: User = Depends(verify_admin),
) -> dict[str, bool]:
    if current_admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot delete your own user")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    session.query(Contact).filter(Contact.created_by == user_id).update({Contact.created_by: current_admin.id})
    session.query(ContactHistory).filter(ContactHistory.added_by == user_id).delete()
    session.query(Log).filter(Log.user_id == user_id).update({Log.user_id: None})
    session.delete(user)
    session.commit()
    return {"ok": True}