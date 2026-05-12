from app.api.routes.auth import router as auth_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.accounts import router as accounts_router
from app.api.routes.assets import router as assets_router
from app.api.routes.health import router as health_router
from app.api.routes.orders import router as orders_router
from app.api.routes.positions import router as positions_router
from app.api.routes.portfolio import router as portfolio_router
from app.api.routes.research import router as research_router
from app.api.routes.risk import router as risk_router
from app.api.routes.signals import router as signals_router
from app.api.routes.snapshots import router as snapshots_router
from app.api.routes.users import router as users_router
from app.core.config import settings


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(assets_router)
app.include_router(positions_router)
app.include_router(research_router)
app.include_router(signals_router)
app.include_router(risk_router)
app.include_router(orders_router)
app.include_router(portfolio_router)
app.include_router(snapshots_router)
app.include_router(users_router)
