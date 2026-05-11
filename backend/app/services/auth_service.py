from datetime import datetime

from sqlalchemy.orm import Session

from app.core.security import generate_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.auth_token_repo import AuthTokenRepository
from app.repositories.user_repo import UserRepository


ALLOWED_ROLES = {"super_admin", "risk_manager", "finance_operator", "auditor"}


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = AuthTokenRepository(db)

    def ensure_default_admin(self) -> User:
        user = self.user_repo.get_by_email("admin@example.com")
        if user is not None:
            return user
        return self.user_repo.create(
            name="超级管理员",
            email="admin@example.com",
            password_hash=hash_password("123456"),
            phone="13800000000",
            role="super_admin",
            status="active",
            mfa_enabled=True,
        )

    def register(self, *, name: str, email: str, password: str, phone: str | None, role: str) -> tuple[str, User]:
        self.ensure_default_admin()
        normalized_role = role if role in ALLOWED_ROLES and role != "super_admin" else "auditor"
        if self.user_repo.get_by_email(email) is not None:
            raise ValueError("email already exists")
        user = self.user_repo.create(
            name=name,
            email=email,
            password_hash=hash_password(password),
            phone=phone,
            role=normalized_role,
            status="active",
            mfa_enabled=False,
        )
        token = self.token_repo.create(user_id=user.id, token=generate_access_token())
        return token.token, user

    def create_user(
        self,
        *,
        actor: User,
        name: str,
        email: str,
        password: str,
        phone: str | None,
        role: str,
        mfa_enabled: bool,
    ) -> User:
        self.ensure_default_admin()
        if self.user_repo.get_by_email(email) is not None:
            raise ValueError("email already exists")

        normalized_role = role if role in ALLOWED_ROLES else "auditor"
        if normalized_role == "super_admin" and actor.role != "super_admin":
            raise ValueError("only super admin can create another super admin")

        return self.user_repo.create(
            name=name,
            email=email,
            password_hash=hash_password(password),
            phone=phone,
            role=normalized_role,
            status="active",
            mfa_enabled=mfa_enabled,
        )

    def login(self, *, email: str, password: str) -> tuple[str, User]:
        self.ensure_default_admin()
        user = self.user_repo.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise ValueError("invalid email or password")
        if user.status != "active":
            raise ValueError("user is disabled")

        user.last_login_at = datetime.utcnow()
        self.user_repo.save(user)
        token = self.token_repo.create(user_id=user.id, token=generate_access_token())
        return token.token, user

    def get_user_by_token(self, token: str) -> User | None:
        auth_token = self.token_repo.get_by_token(token)
        if auth_token is None:
            return None
        return self.user_repo.get(auth_token.user_id)

    def logout(self, token: str) -> None:
        self.token_repo.delete_by_token(token)

    def list_users(self) -> list[User]:
        self.ensure_default_admin()
        return self.user_repo.list_all()

    def update_user(
        self,
        *,
        actor: User,
        user_id: int,
        name: str | None,
        phone: str | None,
        role: str | None,
        mfa_enabled: bool | None,
    ) -> User:
        user = self.user_repo.get(user_id)
        if user is None:
            raise ValueError("user not found")

        if name is not None:
            user.name = name
        if phone is not None:
            user.phone = phone
        if mfa_enabled is not None:
            user.mfa_enabled = mfa_enabled
        if role is not None:
            if role not in ALLOWED_ROLES:
                raise ValueError("invalid role")
            if actor.role != "super_admin":
                raise ValueError("only super admin can change roles")
            user.role = role

        return self.user_repo.save(user)

    def disable_user(self, *, actor: User, user_id: int) -> User:
        user = self.user_repo.get(user_id)
        if user is None:
            raise ValueError("user not found")
        if user.id == actor.id:
            raise ValueError("cannot disable current user")
        user.status = "disabled"
        return self.user_repo.save(user)
