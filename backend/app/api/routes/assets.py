from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.db import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetCreateRequest, AssetItem, AssetUpdateRequest
from app.services.asset_service import AssetService


router = APIRouter(prefix="/v1/assets", tags=["assets"])


def serialize_asset(asset: Asset) -> AssetItem:
    return AssetItem(
        id=asset.id,
        account_id=asset.account_id,
        asset_code=asset.asset_code,
        asset_name=asset.asset_name,
        category=asset.category,
        quantity=asset.quantity,
        frozen_quantity=asset.frozen_quantity,
        unit_price=asset.unit_price,
        currency=asset.currency,
        status=asset.status,
        note=asset.note,
        valuation=asset.quantity * asset.unit_price,
        created_at=asset.created_at.isoformat() + "Z",
        updated_at=asset.updated_at.isoformat() + "Z",
    )


@router.get("", response_model=list[AssetItem], dependencies=[Depends(require_permission("assets.view"))])
def list_assets(db: Session = Depends(get_db)):
    return [serialize_asset(asset) for asset in AssetService(db).list_assets()]


@router.post("", response_model=AssetItem, dependencies=[Depends(require_permission("assets.create"))])
def create_asset(payload: AssetCreateRequest, db: Session = Depends(get_db)):
    try:
        asset = AssetService(db).create_asset(**payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_asset(asset)


@router.patch("/{asset_id}", response_model=AssetItem, dependencies=[Depends(require_permission("assets.edit"))])
def update_asset(asset_id: int, payload: AssetUpdateRequest, db: Session = Depends(get_db)):
    try:
        asset = AssetService(db).update_asset(asset_id, **payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_asset(asset)


@router.delete("/{asset_id}", dependencies=[Depends(require_permission("assets.delete"))])
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    try:
        AssetService(db).delete_asset(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "ok", "asset_id": asset_id}
