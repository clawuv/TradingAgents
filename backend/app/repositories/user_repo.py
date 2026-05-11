from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> User:
        obj = User(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.scalars(stmt).first()

    def list_all(self) -> list[User]:
        stmt = select(User).order_by(User.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def save(self, obj: User) -> User:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
