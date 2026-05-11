from sqlalchemy.orm import Session

from app.models.cash_ledger import CashLedgerEntry


class CashLedgerRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> CashLedgerEntry:
        obj = CashLedgerEntry(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
