"""Reusable application service for running TradingAgents analyses."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import date
from typing import Any, Iterable, Sequence

from tradingagents.default_config import DEFAULT_CONFIG


DEFAULT_ANALYST_ORDER = ("market", "social", "news", "fundamentals")


@dataclass(frozen=True)
class AnalysisResult:
    """Normalized response payload returned by the service layer."""

    ticker: str
    trade_date: str
    decision: str
    final_trade_decision: str
    market_report: str = ""
    sentiment_report: str = ""
    news_report: str = ""
    fundamentals_report: str = ""
    investment_plan: str = ""
    trader_investment_plan: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "ticker": self.ticker,
            "trade_date": self.trade_date,
            "decision": self.decision,
            "final_trade_decision": self.final_trade_decision,
            "market_report": self.market_report,
            "sentiment_report": self.sentiment_report,
            "news_report": self.news_report,
            "fundamentals_report": self.fundamentals_report,
            "investment_plan": self.investment_plan,
            "trader_investment_plan": self.trader_investment_plan,
        }


class AnalysisService:
    """Thin orchestration wrapper shared by CLI, bots, and future APIs."""

    def __init__(
        self,
        base_config: dict[str, Any] | None = None,
        selected_analysts: Sequence[str] | None = None,
    ) -> None:
        self.base_config = deepcopy(base_config or DEFAULT_CONFIG)
        self.selected_analysts = self._normalize_analysts(selected_analysts)

    def build_config(self, config_overrides: dict[str, Any] | None = None) -> dict[str, Any]:
        """Return a fresh config dict with caller overrides applied."""
        config = deepcopy(self.base_config)
        if config_overrides:
            config.update(config_overrides)
        return config

    def analyze(
        self,
        ticker: str,
        trade_date: str | None = None,
        *,
        config_overrides: dict[str, Any] | None = None,
        selected_analysts: Sequence[str] | None = None,
        debug: bool = False,
        callbacks: list[Any] | None = None,
    ) -> AnalysisResult:
        """Run the full TradingAgents graph and normalize its result payload."""
        ticker_value = ticker.strip().upper()
        trade_date_value = trade_date or date.today().isoformat()
        analyst_keys = self._normalize_analysts(selected_analysts) or self.selected_analysts
        config = self.build_config(config_overrides)

        graph = self._create_graph(
            selected_analysts=list(analyst_keys),
            debug=debug,
            config=config,
            callbacks=callbacks,
        )
        final_state, decision = graph.propagate(ticker_value, trade_date_value)

        return AnalysisResult(
            ticker=ticker_value,
            trade_date=trade_date_value,
            decision=decision,
            final_trade_decision=final_state["final_trade_decision"],
            market_report=final_state.get("market_report", ""),
            sentiment_report=final_state.get("sentiment_report", ""),
            news_report=final_state.get("news_report", ""),
            fundamentals_report=final_state.get("fundamentals_report", ""),
            investment_plan=final_state.get("investment_plan", ""),
            trader_investment_plan=final_state.get("trader_investment_plan", ""),
        )

    @staticmethod
    def _create_graph(
        *,
        selected_analysts: list[str],
        debug: bool,
        config: dict[str, Any],
        callbacks: list[Any] | None,
    ) -> Any:
        """Lazily import and instantiate the LangGraph workflow."""
        from tradingagents.graph.trading_graph import TradingAgentsGraph

        return TradingAgentsGraph(
            selected_analysts=selected_analysts,
            debug=debug,
            config=config,
            callbacks=callbacks,
        )

    @staticmethod
    def _normalize_analysts(selected_analysts: Sequence[str] | None) -> list[str]:
        """Normalize analyst selection to the predefined execution order."""
        if not selected_analysts:
            return list(DEFAULT_ANALYST_ORDER)

        normalized = {item.strip().lower() for item in selected_analysts if item and item.strip()}
        ordered = [name for name in DEFAULT_ANALYST_ORDER if name in normalized]
        if not ordered:
            raise ValueError(
                "selected_analysts must include at least one of: "
                + ", ".join(DEFAULT_ANALYST_ORDER)
            )
        return ordered


def list_supported_providers() -> Iterable[str]:
    """Expose provider names for integrations that need help text."""
    return (
        "openai",
        "google",
        "anthropic",
        "xai",
        "deepseek",
        "qwen",
        "glm",
        "openrouter",
        "ollama",
        "azure",
    )
