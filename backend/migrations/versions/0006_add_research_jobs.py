"""add research jobs

Revision ID: 0006_add_research_jobs
Revises: 0005_add_assets_table
Create Date: 2026-05-13 16:40:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_add_research_jobs"
down_revision: Union[str, None] = "0005_add_assets_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "research_jobs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("ticker", sa.String(length=24), nullable=False),
        sa.Column("trade_date", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="queued"),
        sa.Column("request_payload", sa.JSON(), nullable=False),
        sa.Column("decision", sa.Text(), nullable=True),
        sa.Column("report_id", sa.String(length=128), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_research_jobs_user_id", "research_jobs", ["user_id"])
    op.create_index("ix_research_jobs_ticker", "research_jobs", ["ticker"])
    op.create_index("ix_research_jobs_trade_date", "research_jobs", ["trade_date"])
    op.create_index("ix_research_jobs_status", "research_jobs", ["status"])
    op.create_index("ix_research_jobs_report_id", "research_jobs", ["report_id"])


def downgrade() -> None:
    op.drop_index("ix_research_jobs_report_id", table_name="research_jobs")
    op.drop_index("ix_research_jobs_status", table_name="research_jobs")
    op.drop_index("ix_research_jobs_trade_date", table_name="research_jobs")
    op.drop_index("ix_research_jobs_ticker", table_name="research_jobs")
    op.drop_index("ix_research_jobs_user_id", table_name="research_jobs")
    op.drop_table("research_jobs")
