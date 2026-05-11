"""initial schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-05-11 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "signals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("as_of_date", sa.String(length=10), nullable=False),
        sa.Column("signal", sa.String(length=16), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("suggested_position_pct", sa.Float(), nullable=False),
        sa.Column("time_horizon_days", sa.Integer(), nullable=False),
        sa.Column("thesis", sa.String(length=4000), nullable=False),
        sa.Column("risks", sa.JSON(), nullable=False),
        sa.Column("invalidators", sa.JSON(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("run_id", "symbol", "as_of_date", name="uq_signals_run_symbol_date"),
    )
    op.create_index("ix_signals_run_id", "signals", ["run_id"])
    op.create_index("ix_signals_symbol", "signals", ["symbol"])
    op.create_index("ix_signals_as_of_date", "signals", ["as_of_date"])

    op.create_table(
        "risk_decisions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("signal_id", sa.Integer(), sa.ForeignKey("signals.id"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reason", sa.String(length=2000), nullable=False),
        sa.Column("applied_rules", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_risk_decisions_signal_id", "risk_decisions", ["signal_id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("signal_id", sa.Integer(), sa.ForeignKey("signals.id"), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("side", sa.String(length=10), nullable=False),
        sa.Column("order_type", sa.String(length=10), nullable=False),
        sa.Column("qty", sa.Float(), nullable=False),
        sa.Column("limit_price", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_orders_signal_id", "orders", ["signal_id"])
    op.create_index("ix_orders_account_id", "orders", ["account_id"])
    op.create_index("ix_orders_symbol", "orders", ["symbol"])

    op.create_table(
        "fills",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("fill_qty", sa.Float(), nullable=False),
        sa.Column("fill_price", sa.Float(), nullable=False),
        sa.Column("fee", sa.Float(), nullable=False),
        sa.Column("filled_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_fills_order_id", "fills", ["order_id"])

    op.create_table(
        "positions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("qty", sa.Float(), nullable=False),
        sa.Column("avg_cost", sa.Float(), nullable=False),
        sa.Column("market_price", sa.Float(), nullable=False),
        sa.Column("market_value", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("account_id", "symbol", name="uq_positions_account_symbol"),
    )
    op.create_index("ix_positions_account_id", "positions", ["account_id"])
    op.create_index("ix_positions_symbol", "positions", ["symbol"])


def downgrade() -> None:
    op.drop_index("ix_positions_symbol", table_name="positions")
    op.drop_index("ix_positions_account_id", table_name="positions")
    op.drop_table("positions")
    op.drop_index("ix_fills_order_id", table_name="fills")
    op.drop_table("fills")
    op.drop_index("ix_orders_symbol", table_name="orders")
    op.drop_index("ix_orders_account_id", table_name="orders")
    op.drop_index("ix_orders_signal_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_risk_decisions_signal_id", table_name="risk_decisions")
    op.drop_table("risk_decisions")
    op.drop_index("ix_signals_as_of_date", table_name="signals")
    op.drop_index("ix_signals_symbol", table_name="signals")
    op.drop_index("ix_signals_run_id", table_name="signals")
    op.drop_table("signals")
