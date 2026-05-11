from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.account_repo import AccountRepository
from app.repositories.position_repo import PositionRepository
from app.repositories.snapshot_repo import PortfolioSnapshotRepository
from app.services.audit_service import AuditService


class PortfolioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PositionRepository(db)
        self.account_repo = AccountRepository(db)
        self.snapshot_repo = PortfolioSnapshotRepository(db)
        self.audit = AuditService(db)

    def get_portfolio(self):
        return self.repo.list_by_account(settings.default_account_id)

    def create_snapshot(self):
        account = self.account_repo.get(settings.default_account_id)
        if account is None:
            raise ValueError("account not found")
        positions = self.repo.list_by_account(settings.default_account_id)
        market_values = [p.market_value for p in positions]
        long_exposure = sum(v for v in market_values if v > 0)
        short_exposure = sum(v for v in market_values if v < 0)
        gross_exposure = long_exposure + abs(short_exposure)
        net_exposure = long_exposure + short_exposure
        equity = account.cash_balance + net_exposure

        snapshot = self.snapshot_repo.create(
            account_id=settings.default_account_id,
            cash=account.cash_balance,
            equity=equity,
            gross_exposure=gross_exposure,
            net_exposure=net_exposure,
            drawdown=0.0,
        )
        self.audit.log(
            event_type="snapshot_created",
            entity_type="portfolio_snapshot",
            entity_id=str(snapshot.id),
            payload={"account_id": snapshot.account_id, "equity": snapshot.equity},
        )
        return snapshot

    def latest_snapshot(self):
        return self.snapshot_repo.latest_by_account(settings.default_account_id)
