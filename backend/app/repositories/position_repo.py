from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.position import Position


class PositionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_account(self, account_id: str) -> list[Position]:
        stmt = select(Position).where(Position.account_id == account_id)
        return list(self.db.scalars(stmt).all())

    def get_by_account_symbol(self, account_id: str, symbol: str) -> Position | None:
        stmt = select(Position).where(Position.account_id == account_id, Position.symbol == symbol)
        return self.db.scalars(stmt).first()
