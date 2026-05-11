from sqlalchemy.orm import Session

from app.models.account import Account


class AccountRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, account_id: str) -> Account | None:
        return self.db.get(Account, account_id)

    def create(self, **kwargs) -> Account:
        obj = Account(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self, obj: Account) -> Account:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
