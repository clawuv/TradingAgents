from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.services.portfolio_service import PortfolioService


router = APIRouter(prefix="/v1/portfolio", tags=["portfolio"], dependencies=[Depends(get_current_user)])


@router.get("")
def get_portfolio(db: Session = Depends(get_db)):
    positions = PortfolioService(db).get_portfolio()
    return {
        "account_id": "paper-main",
        "positions": [
            {
                "symbol": p.symbol,
                "qty": p.qty,
                "avg_cost": p.avg_cost,
                "market_price": p.market_price,
                "market_value": p.market_value,
            }
            for p in positions
        ],
    }
