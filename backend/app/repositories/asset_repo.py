from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset


class AssetRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_account(self, account_id: str) -> list[Asset]:
        stmt = select(Asset).where(Asset.account_id == account_id).order_by(Asset.updated_at.desc(), Asset.id.desc())
        return list(self.db.scalars(stmt).all())

    def get(self, asset_id: int) -> Asset | None:
        return self.db.get(Asset, asset_id)

    def get_by_account_code(self, account_id: str, asset_code: str) -> Asset | None:
        stmt = select(Asset).where(Asset.account_id == account_id, Asset.asset_code == asset_code)
        return self.db.scalars(stmt).first()

    def create(self, **kwargs) -> Asset:
        obj = Asset(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self, obj: Asset) -> Asset:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: Asset) -> None:
        self.db.delete(obj)
        self.db.commit()
