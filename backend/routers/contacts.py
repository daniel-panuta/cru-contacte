from __future__ import annotations

from datetime import datetime
from uuid import UUID

from crud import (find_duplicate_contact, get_contact_with_history,
                  merge_contact_data)
from database import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from middleware import enforce_rate_limit, get_current_user_from_header
from models import Contact, ContactHistory, User
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/contacts", tags=["contacts"])


class ContactCreateInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    firstname: str | None = None
    email: str | None = None
    biserica: str | None = None
    recomandat_de: str | None = None
    tel1: str | None = None
    tel2: str | None = None
    tel3: str | None = None
    social1: str | None = None
    social2: str | None = None
    social3: str | None = None


class ContactResponse(BaseModel):
    id: UUID
    name: str | None
    firstname: str | None
    email: str | None
    biserica: str | None
    recomandat_de: str | None
    tel1: str | None
    tel2: str | None
    tel3: str | None
    social1: str | None
    social2: str | None
    social3: str | None
    created_by: UUID | None
    merged: bool

    @classmethod
    def from_model(cls, contact: Contact, merged: bool) -> "ContactResponse":
        return cls(
            id=contact.id,
            name=contact.name,
            firstname=contact.firstname,
            email=contact.email,
            biserica=contact.biserica,
            recomandat_de=contact.recomandat_de,
            tel1=contact.tel1,
            tel2=contact.tel2,
            tel3=contact.tel3,
            social1=contact.social1,
            social2=contact.social2,
            social3=contact.social3,
            created_by=contact.created_by,
            merged=merged,
        )


class ContactHistoryResponse(BaseModel):
    id: UUID
    contact_id: UUID
    added_by: UUID
    added_at: datetime
    added_by_name: str | None


class ContactDetailsResponse(BaseModel):
    id: UUID
    name: str | None
    firstname: str | None
    email: str | None
    biserica: str | None
    recomandat_de: str | None
    tel1: str | None
    tel2: str | None
    tel3: str | None
    social1: str | None
    social2: str | None
    social3: str | None
    created_by: UUID | None
    created_by_name: str | None
    created_at: datetime
    updated_at: datetime
    history: list[ContactHistoryResponse]


class ContactPatchInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    firstname: str | None = None
    email: str | None = None
    biserica: str | None = None
    recomandat_de: str | None = None
    tel1: str | None = None
    tel2: str | None = None
    tel3: str | None = None
    social1: str | None = None
    social2: str | None = None
    social3: str | None = None


@router.post("", response_model=ContactResponse)
def create_contact(
    request: Request,
    payload: ContactCreateInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_header),
) -> ContactResponse:
    enforce_rate_limit(request, "contacts-create", 30, 60)

    has_name = bool(str(payload.name or "").strip()) or bool(str(payload.firstname or "").strip())
    has_phone = any(str(phone or "").strip() for phone in [payload.tel1, payload.tel2, payload.tel3])

    if not has_name or not has_phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Contactul necesita nume/prenume si cel putin un telefon",
        )

    existing = find_duplicate_contact(
        session,
        payload.name,
        payload.firstname,
        payload.tel1,
        payload.tel2,
        payload.tel3,
    )

    data = payload.model_dump()

    if existing:
        merge_contact_data(existing, data)
        session.add(ContactHistory(contact_id=existing.id, added_by=current_user.id))
        session.commit()
        session.refresh(existing)
        return ContactResponse.from_model(existing, merged=True)

    contact = Contact(**data, created_by=current_user.id)
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return ContactResponse.from_model(contact, merged=False)


@router.get("", response_model=list[ContactDetailsResponse])
def list_contacts(
    request: Request,
    search: str = "",
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_header),
) -> list[ContactDetailsResponse]:
    enforce_rate_limit(request, "contacts-search", 60, 60)
    del current_user

    safe_limit = min(max(limit, 1), 200)
    safe_offset = max(offset, 0)

    stmt = select(Contact).order_by(Contact.created_at.desc()).limit(safe_limit).offset(safe_offset)

    term = search.strip()
    if term:
      like = f"%{term}%"
      stmt = stmt.where(
          or_(
              Contact.name.ilike(like),
              Contact.firstname.ilike(like),
              Contact.email.ilike(like),
              Contact.biserica.ilike(like),
              Contact.recomandat_de.ilike(like),
              Contact.tel1.ilike(like),
              Contact.tel2.ilike(like),
              Contact.tel3.ilike(like),
              Contact.social1.ilike(like),
              Contact.social2.ilike(like),
              Contact.social3.ilike(like),
          )
      )

    contacts = session.scalars(stmt).all()
    return [
        ContactDetailsResponse(
            id=contact.id,
            name=contact.name,
            firstname=contact.firstname,
            email=contact.email,
            biserica=contact.biserica,
            recomandat_de=contact.recomandat_de,
            tel1=contact.tel1,
            tel2=contact.tel2,
            tel3=contact.tel3,
            social1=contact.social1,
            social2=contact.social2,
            social3=contact.social3,
            created_by=contact.created_by,
            created_by_name=None,
            created_at=contact.created_at,
            updated_at=contact.updated_at,
            history=[],
        )
        for contact in contacts
    ]


@router.get("/{contact_id}", response_model=ContactDetailsResponse)
def get_contact(
    contact_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_header),
) -> ContactDetailsResponse:
    del current_user

    payload = get_contact_with_history(session, contact_id)
    if not payload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    return ContactDetailsResponse(
        id=payload["id"],
        name=payload["name"],
        firstname=payload["firstname"],
        email=payload["email"],
        biserica=payload["biserica"],
        recomandat_de=payload["recomandat_de"],
        tel1=payload["tel1"],
        tel2=payload["tel2"],
        tel3=payload["tel3"],
        social1=payload["social1"],
        social2=payload["social2"],
        social3=payload["social3"],
        created_by=payload["created_by"],
        created_by_name=payload.get("created_by_name"),
        created_at=payload["created_at"],
        updated_at=payload["updated_at"],
        history=[ContactHistoryResponse(**entry) for entry in payload.get("history", [])],
    )


@router.patch("/{contact_id}", response_model=ContactDetailsResponse)
def patch_contact(
    contact_id: UUID,
    payload: ContactPatchInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_header),
) -> ContactDetailsResponse:
    del current_user

    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields provided")

    candidate_name = str(changes.get("name", contact.name) or "").strip()
    candidate_firstname = str(changes.get("firstname", contact.firstname) or "").strip()
    candidate_phones = [
        changes.get("tel1", contact.tel1),
        changes.get("tel2", contact.tel2),
        changes.get("tel3", contact.tel3),
    ]

    has_name = bool(candidate_name) or bool(candidate_firstname)
    has_phone = any(str(phone or "").strip() for phone in candidate_phones)
    if not has_name or not has_phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Contactul necesita nume/prenume si cel putin un telefon",
        )

    for field, value in changes.items():
        setattr(contact, field, value)

    session.commit()
    session.refresh(contact)

    details = get_contact_with_history(session, contact_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    return ContactDetailsResponse(
        id=details["id"],
        name=details["name"],
        firstname=details["firstname"],
        email=details["email"],
        biserica=details["biserica"],
        recomandat_de=details["recomandat_de"],
        tel1=details["tel1"],
        tel2=details["tel2"],
        tel3=details["tel3"],
        social1=details["social1"],
        social2=details["social2"],
        social3=details["social3"],
        created_by=details["created_by"],
        created_by_name=details.get("created_by_name"),
        created_at=details["created_at"],
        updated_at=details["updated_at"],
        history=[ContactHistoryResponse(**entry) for entry in details.get("history", [])],
    )


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_header),
) -> dict[str, bool]:
    del current_user

    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    session.query(ContactHistory).filter(ContactHistory.contact_id == contact_id).delete()
    session.delete(contact)
    session.commit()
    return {"ok": True}
