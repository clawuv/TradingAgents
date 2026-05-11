from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Signal(Base):
    __tablename__ = "signals"
    __table_args__ = (UniqueConstraint("run_id", "symbol", "as_of_date", name="uq_signals_run_symbol_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(64), index=True)
    symbol: Mapped[str] = mapped_column(String(32), index=True)
    as_of_date: Mapped[str] = mapped_column(String(10), index=True)
    signal: Mapped[str] = mapped_column(String(16))
    confidence: Mapped[float] = mapped_column(Float)
    suggested_position_pct: Mapped[float] = mapped_column(Float)
    time_horizon_days: Mapped[int] = mapped_column()
    thesis: Mapped[str] = mapped_column(String(4000))
    risks: Mapped[list] = mapped_column(JSON)
    invalidators: Mapped[list] = mapped_column(JSON)
    evidence: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="NEW")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
