from pydantic import BaseModel, EmailStr, Field


class AuthUserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    role: str
    status: str
    mfa_enabled: bool
    last_login_at: str | None
    created_at: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str | None = None
    role: str = "auditor"
