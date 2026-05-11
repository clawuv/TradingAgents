from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.db import get_db
from app.schemas.signal import SignalIngestRequest
from app.services.signal_service import SignalService


router = APIRouter(prefix="/v1/signals", tags=["signals"], dependencies=[Depends(require_permission("exchange.placeOrder"))])


@router.post("/ingest")
def ingest_signal(req: SignalIngestRequest, db: Session = Depends(get_db)):
    signal = SignalService(db).ingest(req)
    return {
        "id": signal.id,
        "symbol": signal.symbol,
        "signal": signal.signal,
        "status": signal.status,
    }
