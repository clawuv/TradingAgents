"""add accounts and cash ledger

Revision ID: 0003_add_accounts_and_cash_ledger
Revises: 0002_add_snapshots_and_audit
Create Date: 2026-05-11 00:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_add_accounts_and_cash_ledger"
down_revision: Union[str, None] = "0002_add_snapshots_and_audit"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "accounts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("base_currency", sa.String(length=16), nullable=False),
        sa.Column("cash_balance", sa.Float(), nullable=False),
        sa.Column("equity", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "cash_ledger",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("account_id", sa.String(length=64), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("entry_type", sa.String(length=32), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=16), nullable=False),
        sa.Column("reference_type", sa.String(length=32), nullable=False),
        sa.Column("reference_id", sa.String(length=64), nullable=False),
        sa.Column("note", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_cash_ledger_account_id", "cash_ledger", ["account_id"])


def downgrade() -> None:
    op.drop_index("ix_cash_ledger_account_id", table_name="cash_ledger")
    op.drop_table("cash_ledger")
    op.drop_table("accounts")
