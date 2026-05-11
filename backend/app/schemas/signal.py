from typing import Literal

from pydantic import BaseModel, Field


class SignalIngestRequest(BaseModel):
    run_id: str
    symbol: str
    as_of_date: str
    signal: Literal["BUY", "SELL", "HOLD"]
    confidence: float = Field(ge=0, le=1)
    suggested_position_pct: float = Field(ge=0, le=1)
    time_horizon_days: int = Field(gt=0)
    thesis: str
    risks: list[str]
    invalidators: list[str]
    evidence: dict[str, str]
