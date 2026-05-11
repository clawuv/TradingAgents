from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.db import get_db
from app.services.account_service import AccountService


router = APIRouter(prefix="/v1/accounts", tags=["accounts"], dependencies=[Depends(require_permission("assets.view"))])


@router.post("/bootstrap")
def bootstrap_account(db: Session = Depends(get_db)):
    account = AccountService(db).ensure_default_account()
    return {
        "account_id": account.id,
        "cash_balance": account.cash_balance,
        "equity": account.equity,
    }


@router.get("/default")
def get_default_account(db: Session = Depends(get_db)):
    account = AccountService(db).get_default_account()
    if account is None:
        raise HTTPException(status_code=404, detail="default account not found")
    return {
        "account_id": account.id,
        "cash_balance": account.cash_balance,
        "equity": account.equity,
        "base_currency": account.base_currency,
    }
