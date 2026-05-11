from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.auth_token import AuthToken


class AuthTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AuthToken:
        obj = AuthToken(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get_by_token(self, token: str) -> AuthToken | None:
        stmt = select(AuthToken).where(AuthToken.token == token)
        return self.db.scalars(stmt).first()

    def delete_by_token(self, token: str) -> None:
        self.db.execute(delete(AuthToken).where(AuthToken.token == token))
        self.db.commit()
