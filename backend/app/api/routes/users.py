from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.db import get_db
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserListItem, UserUpdateRequest
from app.services.auth_service import AuthService


router = APIRouter(prefix="/v1/users", tags=["users"])


@router.get("", response_model=list[UserListItem], dependencies=[Depends(require_permission("users.view"))])
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


@router.post("", response_model=UserListItem, dependencies=[Depends(require_permission("users.create"))])
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user = AuthService(db).create_user(
            actor=current_user,
            name=payload.name,
            email=payload.email,
            password=payload.password,
            phone=payload.phone,
            role=payload.role,
            mfa_enabled=payload.mfa_enabled,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UserListItem(
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


@router.patch("/{user_id}", response_model=UserListItem, dependencies=[Depends(require_permission("users.edit"))])
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user = AuthService(db).update_user(
            actor=current_user,
            user_id=user_id,
            name=payload.name,
            phone=payload.phone,
            role=payload.role,
            mfa_enabled=payload.mfa_enabled,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UserListItem(
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


@router.post("/{user_id}/disable", response_model=UserListItem, dependencies=[Depends(require_permission("users.disable"))])
def disable_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user = AuthService(db).disable_user(actor=current_user, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UserListItem(
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
