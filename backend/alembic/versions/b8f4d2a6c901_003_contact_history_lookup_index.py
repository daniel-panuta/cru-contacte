"""003_contact_history_lookup_index

Revision ID: b8f4d2a6c901
Revises: 7d3a5c6e9b12
Create Date: 2026-09-12
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "b8f4d2a6c901"
down_revision = "7d3a5c6e9b12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_contact_history_contact_id", "contact_history", ["contact_id"])


def downgrade() -> None:
    op.drop_index("ix_contact_history_contact_id", table_name="contact_history")