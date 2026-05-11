from fastapi import FastAPI

from app.api.routes.accounts import router as accounts_router
from app.api.routes.health import router as health_router
from app.api.routes.orders import router as orders_router
from app.api.routes.portfolio import router as portfolio_router
from app.api.routes.risk import router as risk_router
from app.api.routes.signals import router as signals_router
from app.api.routes.snapshots import router as snapshots_router
from app.core.config import settings


app = FastAPI(title=settings.app_name)

app.include_router(health_router)
app.include_router(accounts_router)
app.include_router(signals_router)
app.include_router(risk_router)
app.include_router(orders_router)
app.include_router(portfolio_router)
app.include_router(snapshots_router)
