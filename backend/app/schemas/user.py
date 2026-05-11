from pydantic import BaseModel


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
