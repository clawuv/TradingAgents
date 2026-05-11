from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.services.order_service import OrderService


router = APIRouter(prefix="/v1/orders", tags=["orders"])


@router.post("/submit/{signal_id}")
def submit_order(signal_id: int, db: Session = Depends(get_db)):
    try:
        order = OrderService(db).submit_for_signal(signal_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "order_id": order.id,
        "status": order.status,
        "symbol": order.symbol,
        "qty": order.qty,
        "signal_id": signal_id,
    }
