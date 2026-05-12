from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.repositories.asset_repo import AssetRepository


class AssetService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AssetRepository(db)

    def list_assets(self) -> list[Asset]:
        return self.repo.list_by_account(settings.default_account_id)

    def create_asset(
        self,
        *,
        asset_code: str,
        asset_name: str,
        category: str,
        quantity: float,
        frozen_quantity: float,
        unit_price: float,
        currency: str,
        status: str,
        note: str | None,
    ) -> Asset:
        normalized_code = asset_code.strip().upper()
        if self.repo.get_by_account_code(settings.default_account_id, normalized_code) is not None:
            raise ValueError("asset code already exists")
        if frozen_quantity > quantity:
            raise ValueError("frozen quantity cannot exceed quantity")

        return self.repo.create(
            account_id=settings.default_account_id,
            asset_code=normalized_code,
            asset_name=asset_name.strip(),
            category=category.strip(),
            quantity=quantity,
            frozen_quantity=frozen_quantity,
            unit_price=unit_price,
            currency=currency.strip().upper(),
            status=status.strip(),
            note=note.strip() if note else None,
        )

    def update_asset(self, asset_id: int, **kwargs) -> Asset:
        asset = self.repo.get(asset_id)
        if asset is None:
            raise ValueError("asset not found")

        for key, value in kwargs.items():
            if value is None:
                continue
            if isinstance(value, str):
                value = value.strip()
            setattr(asset, key, value)

        if asset.frozen_quantity > asset.quantity:
            raise ValueError("frozen quantity cannot exceed quantity")

        if asset.currency:
            asset.currency = asset.currency.upper()
        return self.repo.save(asset)

    def delete_asset(self, asset_id: int) -> None:
        asset = self.repo.get(asset_id)
        if asset is None:
            raise ValueError("asset not found")
        self.repo.delete(asset)
