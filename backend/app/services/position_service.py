from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.position import Position
from app.repositories.position_repo import PositionRepository


class PositionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PositionRepository(db)

    def list_positions(self) -> list[Position]:
        return self.repo.list_by_account(settings.default_account_id)

    def create_position(self, *, symbol: str, qty: float, avg_cost: float, market_price: float) -> Position:
        normalized_symbol = symbol.strip().upper()
        if not normalized_symbol:
            raise ValueError("symbol is required")
        if self.repo.get_by_account_symbol(settings.default_account_id, normalized_symbol) is not None:
            raise ValueError("position symbol already exists")
        market_value = qty * market_price
        return self.repo.create(
            account_id=settings.default_account_id,
            symbol=normalized_symbol,
            qty=qty,
            avg_cost=avg_cost,
            market_price=market_price,
            market_value=market_value,
        )

    def update_position(self, position_id: int, **kwargs) -> Position:
        position = self.repo.get(position_id)
        if position is None:
            raise ValueError("position not found")

        for key, value in kwargs.items():
            if value is None:
                continue
            setattr(position, key, value)

        position.market_value = position.qty * position.market_price
        return self.repo.save(position)

    def delete_position(self, position_id: int) -> None:
        position = self.repo.get(position_id)
        if position is None:
            raise ValueError("position not found")
        self.repo.delete(position)
