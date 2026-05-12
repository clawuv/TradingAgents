from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.db import get_db
from app.models.position import Position
from app.schemas.position import PositionCreateRequest, PositionItem, PositionUpdateRequest
from app.services.position_service import PositionService


router = APIRouter(prefix="/v1/positions", tags=["positions"])


def serialize_position(position: Position) -> PositionItem:
    return PositionItem(
        id=position.id,
        account_id=position.account_id,
        symbol=position.symbol,
        qty=position.qty,
        avg_cost=position.avg_cost,
        market_price=position.market_price,
        market_value=position.market_value,
        updated_at=position.updated_at.isoformat() + "Z",
    )


@router.get("", response_model=list[PositionItem], dependencies=[Depends(require_permission("positions.view"))])
def list_positions(db: Session = Depends(get_db)):
    return [serialize_position(position) for position in PositionService(db).list_positions()]


@router.post("", response_model=PositionItem, dependencies=[Depends(require_permission("positions.create"))])
def create_position(payload: PositionCreateRequest, db: Session = Depends(get_db)):
    try:
        position = PositionService(db).create_position(**payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_position(position)


@router.patch("/{position_id}", response_model=PositionItem, dependencies=[Depends(require_permission("positions.edit"))])
def update_position(position_id: int, payload: PositionUpdateRequest, db: Session = Depends(get_db)):
    try:
        position = PositionService(db).update_position(position_id, **payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_position(position)


@router.delete("/{position_id}", dependencies=[Depends(require_permission("positions.delete"))])
def delete_position(position_id: int, db: Session = Depends(get_db)):
    try:
        PositionService(db).delete_position(position_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "ok", "position_id": position_id}
