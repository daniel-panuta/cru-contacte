"""002_contact_search_indexes

Revision ID: 7d3a5c6e9b12
Revises: 13d91acc067a
Create Date: 2026-09-12
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "7d3a5c6e9b12"
down_revision = "13d91acc067a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_contacts_name", "contacts", ["name"])
    op.create_index("ix_contacts_firstname", "contacts", ["firstname"])
    op.create_index("ix_contacts_tel1", "contacts", ["tel1"])
    op.create_index("ix_contacts_email", "contacts", ["email"])
    op.create_index("ix_contacts_created_by", "contacts", ["created_by"])


def downgrade() -> None:
    op.drop_index("ix_contacts_created_by", table_name="contacts")
    op.drop_index("ix_contacts_email", table_name="contacts")
    op.drop_index("ix_contacts_tel1", table_name="contacts")
    op.drop_index("ix_contacts_firstname", table_name="contacts")
    op.drop_index("ix_contacts_name", table_name="contacts")