from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security.http import HTTPBearer
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.auth import AuthUserResponse, LoginRequest, LoginResponse, RegisterRequest
from app.services.auth_service import AuthService


router = APIRouter(prefix="/v1/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


def serialize_user(user: User) -> AuthUserResponse:
    return AuthUserResponse(
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


@router.post("/register", response_model=LoginResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        token, user = AuthService(db).register(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            phone=payload.phone,
            role=payload.role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return LoginResponse(access_token=token, user=serialize_user(user))


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        token, user = AuthService(db).login(email=payload.email, password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return LoginResponse(access_token=token, user=serialize_user(user))


@router.get("/me", response_model=AuthUserResponse)
def me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="authentication required")
    AuthService(db).logout(credentials.credentials)
    return {"status": "ok", "user_id": current_user.id}
