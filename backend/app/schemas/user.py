from pydantic import BaseModel, EmailStr, Field


class UserListItem(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    role: str
    status: str
    mfa_enabled: bool
    last_login_at: str | None
    created_at: str


class UserUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    role: str | None = None
    mfa_enabled: bool | None = None


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str | None = None
    role: str = "auditor"
    mfa_enabled: bool = False
