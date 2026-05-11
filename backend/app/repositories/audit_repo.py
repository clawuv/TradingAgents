from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent


class AuditEventRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AuditEvent:
        obj = AuditEvent(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
