from datetime import datetime

from sqlalchemy.orm import Session

from app.brokers.paper import PaperBroker
from app.core.config import settings
from app.models.fill import Fill
from app.models.position import Position
from app.repositories.order_repo import OrderRepository
from app.repositories.position_repo import PositionRepository
from app.repositories.signal_repo import SignalRepository
from app.services.account_service import AccountService
from app.services.audit_service import AuditService


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.signal_repo = SignalRepository(db)
        self.order_repo = OrderRepository(db)
        self.position_repo = PositionRepository(db)
        self.account_service = AccountService(db)
        self.audit = AuditService(db)
        self.broker = PaperBroker()

    def submit_for_signal(self, signal_id: int):
        self.account_service.ensure_default_account()
        signal = self.signal_repo.get(signal_id)
        if signal is None:
            raise ValueError("signal not found")
        if signal.status != "APPROVED":
            raise ValueError("signal is not approved")

        side = "BUY" if signal.signal == "BUY" else "SELL"
        qty = round(signal.suggested_position_pct * 100, 4)

        order = self.order_repo.create(
            signal_id=signal.id,
            account_id=settings.default_account_id,
            symbol=signal.symbol,
            side=side,
            order_type="MARKET",
            qty=qty,
            status="SUBMITTED",
            submitted_at=datetime.utcnow(),
        )
        self.audit.log(
            event_type="order_submitted",
            entity_type="order",
            entity_id=str(order.id),
            payload={"signal_id": signal.id, "symbol": order.symbol, "side": side, "qty": qty},
        )

        broker_result = self.broker.submit_order(signal.symbol, side, qty, "MARKET")
        order.status = broker_result["status"]
        self.order_repo.save(order)

        fill = Fill(
            order_id=order.id,
            fill_qty=broker_result["fill_qty"],
            fill_price=broker_result["fill_price"],
            fee=broker_result["fee"],
        )
        self.db.add(fill)

        position = self.position_repo.get_by_account_symbol(settings.default_account_id, signal.symbol)
        if position is None:
            position = Position(
                account_id=settings.default_account_id,
                symbol=signal.symbol,
                qty=0.0,
                avg_cost=0.0,
                market_price=0.0,
                market_value=0.0,
            )
        signed_qty = qty if side == "BUY" else -qty
        position.qty += signed_qty
        position.avg_cost = broker_result["fill_price"]
        position.market_price = broker_result["fill_price"]
        position.market_value = position.qty * position.market_price
        self.db.add(position)

        gross_amount = broker_result["fill_qty"] * broker_result["fill_price"]
        fee = broker_result["fee"]
        if side == "BUY":
            self.account_service.apply_cash_entry(
                settings.default_account_id, "BUY_FILL", -gross_amount, "order", str(order.id), f"Buy {order.symbol}"
            )
        else:
            self.account_service.apply_cash_entry(
                settings.default_account_id, "SELL_FILL", gross_amount, "order", str(order.id), f"Sell {order.symbol}"
            )
        if fee > 0:
            self.account_service.apply_cash_entry(
                settings.default_account_id, "FEE", -fee, "order", str(order.id), "Broker fee"
            )

        signal.status = "EXECUTED"
        self.db.add(signal)
        self.db.commit()
        self.audit.log(
            event_type="order_filled",
            entity_type="order",
            entity_id=str(order.id),
            payload={"fill_qty": broker_result["fill_qty"], "fill_price": broker_result["fill_price"], "fee": fee},
        )
        self.db.refresh(order)
        return order
