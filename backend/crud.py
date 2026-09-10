from __future__ import annotations

import json
import re
from uuid import UUID

from models import Contact
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session


def normalize_phone_for_match(value: str | None) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""

    digits = re.sub(r"\D", "", raw)
    if not digits:
        return raw.lower()

    if digits.startswith("0040") and len(digits) == 13:
        return f"0{digits[4:]}"
    if digits.startswith("40") and len(digits) == 11:
        return f"0{digits[2:]}"

    return digits


def _phone_set(values: list[str | None]) -> set[str]:
    normalized = {normalize_phone_for_match(value) for value in values}
    normalized.discard("")
    return normalized


def find_duplicate_contact(
    session: Session,
    name: str | None,
    firstname: str | None,
    tel1: str | None,
    tel2: str | None,
    tel3: str | None,
) -> Contact | None:
    name_key = str(name or "").strip().lower()
    firstname_key = str(firstname or "").strip().lower()
    input_phones = _phone_set([tel1, tel2, tel3])

    if not input_phones:
        return None

    stmt = (
        select(Contact)
        .where(func.lower(func.coalesce(Contact.name, "")) == name_key)
        .where(func.lower(func.coalesce(Contact.firstname, "")) == firstname_key)
        .order_by(Contact.created_at.asc())
    )
    candidates = session.scalars(stmt).all()

    for contact in candidates:
        existing_phones = _phone_set([contact.tel1, contact.tel2, contact.tel3])
        if existing_phones.intersection(input_phones):
            return contact

    return None


def merge_contact_data(existing: Contact, payload: dict[str, str | None]) -> bool:
    changed = False

    for field in ["name", "firstname", "email", "biserica", "recomandat_de", "social1", "social2", "social3"]:
        current_value = str(getattr(existing, field) or "").strip()
        incoming_value = str(payload.get(field) or "").strip()
        if not current_value and incoming_value:
            setattr(existing, field, incoming_value)
            changed = True

    used_phones = _phone_set([existing.tel1, existing.tel2, existing.tel3])
    incoming_phones = [payload.get("tel1"), payload.get("tel2"), payload.get("tel3")]

    for raw_phone in incoming_phones:
        incoming_raw = str(raw_phone or "").strip()
        if not incoming_raw:
            continue

        normalized = normalize_phone_for_match(incoming_raw)
        if not normalized or normalized in used_phones:
            continue

        for slot in ["tel1", "tel2", "tel3"]:
            slot_value = str(getattr(existing, slot) or "").strip()
            if not slot_value:
                setattr(existing, slot, incoming_raw)
                used_phones.add(normalized)
                changed = True
                break

    return changed


def get_contact_with_history(session: Session, contact_id: UUID) -> dict | None:
    query = text(
        """
        SELECT
            c.id,
            c.name,
            c.firstname,
            c.email,
            c.biserica,
            c.recomandat_de,
            c.tel1,
            c.tel2,
            c.tel3,
            c.social1,
            c.social2,
            c.social3,
            c.created_by,
            c.created_at,
            c.updated_at,
            u.name AS created_by_name,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', ch.id,
                        'contact_id', ch.contact_id,
                        'added_by', ch.added_by,
                        'added_at', ch.added_at,
                        'added_by_name', u2.name
                    ) ORDER BY ch.added_at DESC
                ) FILTER (WHERE ch.id IS NOT NULL),
                '[]'::json
            ) AS history
        FROM contacts c
        LEFT JOIN users u ON u.id = c.created_by
        LEFT JOIN contact_history ch ON ch.contact_id = c.id
        LEFT JOIN users u2 ON u2.id = ch.added_by
        WHERE c.id = :contact_id
        GROUP BY c.id, u.name
        """
    )

    row = session.execute(query, {"contact_id": contact_id}).mappings().first()
    if not row:
        return None

    result = dict(row)
    history = result.get("history")
    if history is None:
        result["history"] = []
    elif isinstance(history, str):
        result["history"] = json.loads(history)
    else:
        result["history"] = list(history)

    return result
