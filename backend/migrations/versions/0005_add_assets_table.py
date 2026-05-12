"""add assets table

Revision ID: 0005_add_assets_table
Revises: 0004_add_auth_tables
Create Date: 2026-05-11 16:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_add_assets_table"
down_revision: Union[str, None] = "0004_add_auth_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assets",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("asset_code", sa.String(length=32), nullable=False),
        sa.Column("asset_name", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False, server_default="spot"),
        sa.Column("quantity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("frozen_quantity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("unit_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=16), nullable=False, server_default="USD"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("note", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("account_id", "asset_code", name="uq_assets_account_code"),
    )
    op.create_index("ix_assets_account_id", "assets", ["account_id"])
    op.create_index("ix_assets_asset_code", "assets", ["asset_code"])


def downgrade() -> None:
    op.drop_index("ix_assets_asset_code", table_name="assets")
    op.drop_index("ix_assets_account_id", table_name="assets")
    op.drop_table("assets")
