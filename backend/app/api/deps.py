from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.core.db import get_db
from app.models.user import User
from app.services.auth_service import AuthService


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="authentication required")

    user = AuthService(db).get_user_by_token(credentials.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="user is disabled")
    return user


def require_permission(permission: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(status_code=403, detail=f"permission denied: {permission}")
        return current_user

    return dependency
