from pydantic import BaseModel


class OrderListItem(BaseModel):
    order_id: int
    signal_id: int
    account_id: str
    symbol: str
    side: str
    order_type: str
    qty: float
    status: str
    limit_price: float | None
    fill_price: float | None
    fee: float | None
    submitted_at: str | None
    created_at: str
