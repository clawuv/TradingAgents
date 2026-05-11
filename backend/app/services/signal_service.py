from sqlalchemy.orm import Session

from app.repositories.signal_repo import SignalRepository
from app.schemas.signal import SignalIngestRequest
from app.services.audit_service import AuditService


class SignalService:
    def __init__(self, db: Session):
        self.repo = SignalRepository(db)
        self.audit = AuditService(db)

    def ingest(self, req: SignalIngestRequest):
        existing = self.repo.get_by_natural_key(req.run_id, req.symbol, req.as_of_date)
        if existing is not None:
            return existing

        signal = self.repo.create(
            run_id=req.run_id,
            symbol=req.symbol,
            as_of_date=req.as_of_date,
            signal=req.signal,
            confidence=req.confidence,
            suggested_position_pct=req.suggested_position_pct,
            time_horizon_days=req.time_horizon_days,
            thesis=req.thesis,
            risks=req.risks,
            invalidators=req.invalidators,
            evidence=req.evidence,
            status="NEW",
        )
        self.audit.log(
            event_type="signal_ingested",
            entity_type="signal",
            entity_id=str(signal.id),
            payload={"symbol": signal.symbol, "signal": signal.signal, "confidence": signal.confidence},
        )
        return signal
