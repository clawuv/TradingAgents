from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.risk_decision import RiskDecision
from app.repositories.position_repo import PositionRepository
from app.repositories.signal_repo import SignalRepository
from app.services.audit_service import AuditService


class RiskService:
    def __init__(self, db: Session):
        self.db = db
        self.signal_repo = SignalRepository(db)
        self.position_repo = PositionRepository(db)
        self.audit = AuditService(db)

    def evaluate(self, signal_id: int) -> RiskDecision:
        signal = self.signal_repo.get(signal_id)
        if signal is None:
            raise ValueError("signal not found")

        positions = self.position_repo.list_by_account(settings.default_account_id)
        total_exposure = sum(abs(p.market_value) for p in positions)
        signal_exposure = signal.suggested_position_pct * 100.0
        applied_rules = {}

        if settings.kill_switch_enabled:
            status = "REJECTED"
            reason = "kill switch enabled"
            applied_rules["kill_switch"] = True
        elif signal.signal == "HOLD":
            status = "REJECTED"
            reason = "hold signal does not create order"
            applied_rules["hold_blocked"] = True
        elif signal.suggested_position_pct > settings.max_single_position_pct:
            status = "REJECTED"
            reason = "suggested position exceeds max_single_position_pct"
            applied_rules["max_single_position_pct"] = settings.max_single_position_pct
        elif total_exposure + signal_exposure > settings.max_total_exposure_pct * 100.0:
            status = "REJECTED"
            reason = "signal exceeds max_total_exposure_pct"
            applied_rules["max_total_exposure_pct"] = settings.max_total_exposure_pct
        else:
            status = "APPROVED"
            reason = "passed basic risk checks"

        decision = RiskDecision(
            signal_id=signal.id,
            status=status,
            reason=reason,
            applied_rules=applied_rules,
        )
        self.db.add(decision)
        signal.status = "APPROVED" if status == "APPROVED" else "REJECTED"
        self.db.add(signal)
        self.db.commit()
        self.db.refresh(decision)

        self.audit.log(
            event_type="risk_evaluated",
            entity_type="signal",
            entity_id=str(signal.id),
            payload={"status": status, "reason": reason, "applied_rules": applied_rules},
        )
        if status == "REJECTED":
            self.audit.log(
                event_type="signal_rejected",
                entity_type="signal",
                entity_id=str(signal.id),
                payload={"reason": reason},
            )
        return decision
