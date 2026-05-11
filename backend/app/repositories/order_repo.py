from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Order:
        obj = Order(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self, obj: Order) -> Order:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def list_all(self) -> list[Order]:
        stmt = select(Order).order_by(Order.submitted_at.desc(), Order.created_at.desc())
        return list(self.db.scalars(stmt).all())
