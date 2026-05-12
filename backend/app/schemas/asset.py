from pydantic import BaseModel, Field


class AssetItem(BaseModel):
    id: int
    account_id: str
    asset_code: str
    asset_name: str
    category: str
    quantity: float
    frozen_quantity: float
    unit_price: float
    currency: str
    status: str
    note: str | None
    valuation: float
    created_at: str
    updated_at: str


class AssetCreateRequest(BaseModel):
    asset_code: str = Field(min_length=1, max_length=32)
    asset_name: str = Field(min_length=1, max_length=128)
    category: str = Field(min_length=1, max_length=64)
    quantity: float = Field(ge=0)
    frozen_quantity: float = Field(ge=0)
    unit_price: float = Field(ge=0)
    currency: str = Field(min_length=1, max_length=16)
    status: str = Field(min_length=1, max_length=32)
    note: str | None = Field(default=None, max_length=512)


class AssetUpdateRequest(BaseModel):
    asset_name: str | None = Field(default=None, min_length=1, max_length=128)
    category: str | None = Field(default=None, min_length=1, max_length=64)
    quantity: float | None = Field(default=None, ge=0)
    frozen_quantity: float | None = Field(default=None, ge=0)
    unit_price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=16)
    status: str | None = Field(default=None, min_length=1, max_length=32)
    note: str | None = Field(default=None, max_length=512)
