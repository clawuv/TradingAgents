from abc import ABC, abstractmethod


class BrokerBase(ABC):
    @abstractmethod
    def submit_order(self, symbol: str, side: str, qty: float, order_type: str) -> dict:
        raise NotImplementedError
