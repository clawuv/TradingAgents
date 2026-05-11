from sqlalchemy.orm import Session

from app.repositories.audit_repo import AuditEventRepository


class AuditService:
    def __init__(self, db: Session):
        self.repo = AuditEventRepository(db)

    def log(self, event_type: str, entity_type: str, entity_id: str, payload: dict):
        return self.repo.create(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload,
        )
