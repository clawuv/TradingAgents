from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.db import get_db
from app.services.portfolio_service import PortfolioService


router = APIRouter(prefix="/v1/snapshots", tags=["snapshots"], dependencies=[Depends(require_permission("assets.view"))])


@router.post("/create")
def create_snapshot(db: Session = Depends(get_db)):
    snapshot = PortfolioService(db).create_snapshot()
    return {
        "account_id": snapshot.account_id,
        "cash": snapshot.cash,
        "equity": snapshot.equity,
        "gross_exposure": snapshot.gross_exposure,
        "net_exposure": snapshot.net_exposure,
        "drawdown": snapshot.drawdown,
        "snapshot_at": snapshot.snapshot_at.isoformat() + "Z",
    }


@router.get("/latest")
def latest_snapshot(db: Session = Depends(get_db)):
    snapshot = PortfolioService(db).latest_snapshot()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="snapshot not found")
    return {
        "account_id": snapshot.account_id,
        "cash": snapshot.cash,
        "equity": snapshot.equity,
        "gross_exposure": snapshot.gross_exposure,
        "net_exposure": snapshot.net_exposure,
        "drawdown": snapshot.drawdown,
        "snapshot_at": snapshot.snapshot_at.isoformat() + "Z",
    }
