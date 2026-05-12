from pydantic import BaseModel, Field


class PositionItem(BaseModel):
    id: int
    account_id: str
    symbol: str
    qty: float
    avg_cost: float
    market_price: float
    market_value: float
    updated_at: str


class PositionCreateRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    qty: float
    avg_cost: float = Field(ge=0)
    market_price: float = Field(ge=0)


class PositionUpdateRequest(BaseModel):
    qty: float | None = None
    avg_cost: float | None = Field(default=None, ge=0)
    market_price: float | None = Field(default=None, ge=0)
