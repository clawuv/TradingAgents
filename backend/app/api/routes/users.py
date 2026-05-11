from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.user import UserListItem
from app.services.auth_service import AuthService


router = APIRouter(prefix="/v1/users", tags=["users"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[UserListItem])
def list_users(db: Session = Depends(get_db)):
    users = AuthService(db).list_users()
    return [
        UserListItem(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            status=user.status,
            mfa_enabled=user.mfa_enabled,
            last_login_at=user.last_login_at.isoformat() + "Z" if user.last_login_at else None,
            created_at=user.created_at.isoformat() + "Z",
        )
        for user in users
    ]
