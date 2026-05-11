from datetime import datetime

from app.brokers.base import BrokerBase


class PaperBroker(BrokerBase):
    def submit_order(self, symbol: str, side: str, qty: float, order_type: str) -> dict:
        return {
            "broker_order_id": f"paper-{symbol}-{int(datetime.utcnow().timestamp())}",
            "status": "FILLED",
            "fill_price": 100.0,
            "fill_qty": qty,
            "fee": 0.0,
        }
