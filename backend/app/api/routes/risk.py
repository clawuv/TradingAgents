from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.services.risk_service import RiskService


router = APIRouter(prefix="/v1/risk", tags=["risk"], dependencies=[Depends(get_current_user)])


@router.post("/evaluate/{signal_id}")
def evaluate_risk(signal_id: int, db: Session = Depends(get_db)):
    try:
        decision = RiskService(db).evaluate(signal_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "signal_id": signal_id,
        "status": decision.status,
        "reason": decision.reason,
        "applied_rules": decision.applied_rules,
    }
