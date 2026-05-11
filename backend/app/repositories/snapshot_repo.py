from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.portfolio_snapshot import PortfolioSnapshot


class PortfolioSnapshotRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> PortfolioSnapshot:
        obj = PortfolioSnapshot(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def latest_by_account(self, account_id: str) -> PortfolioSnapshot | None:
        stmt = select(PortfolioSnapshot).where(
            PortfolioSnapshot.account_id == account_id
        ).order_by(PortfolioSnapshot.snapshot_at.desc())
        return self.db.scalars(stmt).first()
