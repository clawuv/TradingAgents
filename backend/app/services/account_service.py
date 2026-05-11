from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.account_repo import AccountRepository
from app.repositories.cash_ledger_repo import CashLedgerRepository


class AccountService:
    def __init__(self, db: Session):
        self.db = db
        self.account_repo = AccountRepository(db)
        self.ledger_repo = CashLedgerRepository(db)

    def ensure_default_account(self):
        account = self.account_repo.get(settings.default_account_id)
        if account is None:
            account = self.account_repo.create(
                id=settings.default_account_id,
                name="Paper Main Account",
                base_currency="USD",
                cash_balance=100000.0,
                equity=100000.0,
            )
        return account

    def get_default_account(self):
        return self.account_repo.get(settings.default_account_id)

    def apply_cash_entry(
        self,
        account_id: str,
        entry_type: str,
        amount: float,
        reference_type: str,
        reference_id: str,
        note: str = "",
    ):
        account = self.account_repo.get(account_id)
        if account is None:
            raise ValueError("account not found")

        account.cash_balance += amount
        account.equity += amount
        self.account_repo.save(account)

        return self.ledger_repo.create(
            account_id=account_id,
            entry_type=entry_type,
            amount=amount,
            currency="USD",
            reference_type=reference_type,
            reference_id=reference_id,
            note=note,
        )
