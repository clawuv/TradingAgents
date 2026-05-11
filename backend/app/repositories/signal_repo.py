from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.signal import Signal


class SignalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Signal:
        obj = Signal(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get(self, signal_id: int) -> Signal | None:
        return self.db.get(Signal, signal_id)

    def get_by_natural_key(self, run_id: str, symbol: str, as_of_date: str) -> Signal | None:
        stmt = select(Signal).where(
            Signal.run_id == run_id,
            Signal.symbol == symbol,
            Signal.as_of_date == as_of_date,
        )
        return self.db.scalars(stmt).first()

    def save(self, obj: Signal) -> Signal:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
