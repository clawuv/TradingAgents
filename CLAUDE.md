# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradingAgents is a multi-agent LLM financial trading framework built with LangGraph. The system deploys specialized LLM-powered agents that collaborate to analyze market conditions and inform trading decisions. It's designed for research purposes and not intended as financial advice.

### Core Architecture

The framework is built around **agent teams** organized in a LangGraph workflow:

1. **Analyst Team** (user-selectable): Market Analyst, Social Analyst, News Analyst, Fundamentals Analyst
2. **Research Team**: Bull Researcher, Bear Researcher, Research Manager (structured output)
3. **Trading Team**: Trader (structured output)
4. **Risk Management Team**: Aggressive Analyst, Conservative Analyst, Neutral Analyst
5. **Portfolio Management**: Portfolio Manager (structured output)

### Key Components

- **`tradingagents/graph/trading_graph.py`**: Main orchestration class `TradingAgentsGraph`
- **`tradingagents/graph/setup.py`**: Graph workflow definition using LangGraph StateGraph
- **`tradingagents/llm_clients/`**: Multi-provider LLM client factory (OpenAI, Google, Anthropic, xAI, DeepSeek, Qwen, GLM, OpenRouter, Ollama, Azure)
- **`tradingagents/agents/`**: Individual agent implementations with structured-output schemas
- **`tradingagents/dataflows/`**: Data vendor abstraction layer (yfinance, Alpha Vantage)
- **`cli/main.py`**: Interactive CLI with real-time progress display

## Development Commands

### Installation

```bash
# Create virtual environment
conda create -n tradingagents python=3.13
conda activate tradingagents

# Install package and dependencies
pip install .
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test markers
pytest -m unit          # Fast isolated unit tests
pytest -m integration   # Tests requiring external services
pytest -m smoke         # Quick sanity-check tests

# Run specific test file
pytest tests/test_signal_processing.py
```

### Testing LLM Provider Setup

```bash
# Test structured-output agents against a provider
OPENAI_API_KEY=... python scripts/smoke_structured_output.py openai
GOOGLE_API_KEY=... python scripts/smoke_structured_output.py google
ANTHROPIC_API_KEY=... python scripts/smoke_structured_output.py anthropic
```

### CLI Usage

```bash
# Launch interactive CLI
tradingagents

# Run directly from source
python -m cli.main

# Enable checkpoint/resume for crash recovery
tradingagents analyze --checkpoint

# Clear all checkpoints before running
tradingagents analyze --clear-checkpoints
```

### Python API Usage

```python
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

# Basic usage
ta = TradingAgentsGraph(debug=True, config=DEFAULT_CONFIG.copy())
_, decision = ta.propagate("NVDA", "2026-01-15")

# Custom configuration
config = DEFAULT_CONFIG.copy()
config["llm_provider"] = "openai"
config["deep_think_llm"] = "gpt-5.4"
config["quick_think_llm"] = "gpt-5.4-mini"
config["max_debate_rounds"] = 2
config["checkpoint_enabled"] = True

ta = TradingAgentsGraph(config=config)
_, decision = ta.propagate("NVDA", "2026-01-15")
```

### Docker

```bash
# Standard build
cp .env.example .env  # Add API keys
docker compose run --rm tradingagents

# Local models with Ollama
docker compose --profile ollama run --rm tradingagents-ollama
```

## Configuration System

Configuration is dictionary-based with these key settings (see `tradingagents/default_config.py`):

```python
{
    # LLM Provider
    "llm_provider": "openai",  # openai, google, anthropic, xai, deepseek, qwen, glm, openrouter, ollama, azure
    "deep_think_llm": "gpt-5.4",
    "quick_think_llm": "gpt-5.4-mini",
    "backend_url": None,  # Provider-specific override when None uses native default

    # Provider-specific thinking configuration
    "google_thinking_level": None,      # "high", "minimal"
    "openai_reasoning_effort": None,    # "medium", "high", "low"
    "anthropic_effort": None,           # "high", "medium", "low"

    # Debate rounds
    "max_debate_rounds": 1,
    "max_risk_discuss_rounds": 1,

    # Data vendors (category and tool-level)
    "data_vendors": {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "fundamental_data": "yfinance",
        "news_data": "yfinance",
    },

    # Persistence
    "checkpoint_enabled": False,  # Enable crash recovery
    "output_language": "English",

    # Directory overrides (default: ~/.tradingagents/)
    "results_dir": "...",
    "data_cache_dir": "...",
    "memory_log_path": "...",
}
```

## Persistence and Recovery

### Decision Log (Always On)

Decisions are automatically appended to `~/.tradingagents/memory/trading_memory.md`. On subsequent runs for the same ticker:

1. Prior pending entries are resolved with realized returns (raw and alpha vs SPY)
2. A one-paragraph reflection is generated via LLM
3. Both same-ticker decisions and cross-ticker lessons are injected into Portfolio Manager context

Override with environment variable: `TRADINGAGENTS_MEMORY_LOG_PATH`

### Checkpoint Resume (Opt-In)

When `checkpoint_enabled=True`, LangGraph saves state after each node to per-ticker SQLite databases at `~/.tradingagents/cache/checkpoints/<TICKER>.db`. Crashed runs resume from the last successful step.

Override base directory with: `TRADINGAGENTS_CACHE_DIR`

## LLM Provider System

The framework uses a factory pattern (`tradingagents/llm_clients/factory.py`) with lazy imports to avoid pulling in heavy SDKs during test collection. Each provider is implemented as a subclass of `BaseLLMClient`:

- **OpenAI-compatible**: OpenAI, xAI, DeepSeek, Qwen, GLM, Ollama, OpenRouter
- **Anthropic**: Native Claude support with effort control
- **Google**: Gemini with thinking level configuration
- **Azure**: Enterprise OpenAI support

## Structured Output

Three decision-making agents use provider-native structured output:
- **Research Manager**: `ResearchPlan` (recommendation, rationale, strategic_actions)
- **Trader**: `TraderProposal` (action, reasoning, entry_price, stop_loss, position_sizing)
- **Portfolio Manager**: `PortfolioDecision` (rating, executive_summary, investment_thesis, price_target, time_horizon)

Schemas are defined in `tradingagents/agents/schemas.py` with render helpers that convert Pydantic instances back to markdown for display/memory/storage.

## Agent State Management

The framework uses LangGraph's `MessagesState` with custom `AgentState` (see `tradingagents/agents/utils/agent_states.py`):

- **Analyst reports**: `market_report`, `sentiment_report`, `news_report`, `fundamentals_report`
- **Investment debate**: `investment_debate_state` (bull/bear history, judge decision)
- **Trading**: `investment_plan`, `trader_investment_plan`
- **Risk debate**: `risk_debate_state` (aggressive/conservative/neutral history, judge decision)
- **Final**: `final_trade_decision`, `past_context` (memory log injection)

## Data Vendor Abstraction

Data tools are organized by category in `tradingagents/agents/utils/agent_utils.py`:

- **Core stock data**: `get_stock_data`
- **Technical indicators**: `get_indicators`
- **Fundamental data**: `get_fundamentals`, `get_balance_sheet`, `get_cashflow`, `get_income_statement`
- **News data**: `get_news`, `get_global_news`, `get_insider_transactions`

Each data category can be configured to use yfinance or Alpha Vantage via the `data_vendors` config.

## Ticker Symbol Handling

Always use `safe_ticker_component()` from `tradingagents/dataflows/utils.py` when using ticker symbols as path components. This validates and sanitizes ticker input to prevent directory traversal attacks.

## Environment Variables

Required API keys (set in `.env` or environment):
- `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`
- `XAI_API_KEY`, `DEEPSEEK_API_KEY`, `DASHSCOPE_API_KEY`, `ZHIPU_API_KEY`
- `OPENROUTER_API_KEY`, `ALPHA_VANTAGE_API_KEY`
- `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` (for Azure)

Optional overrides:
- `TRADINGAGENTS_RESULTS_DIR`, `TRADINGAGENTS_CACHE_DIR`, `TRADINGAGENTS_MEMORY_LOG_PATH`

## Testing Notes

- Tests use pytest fixtures in `tests/conftest.py` to avoid CI hangs when API keys are absent
- Mock LLM clients are provided via `mock_llm_client` fixture
- Test markers: `unit`, `integration`, `smoke`
- File I/O always uses explicit `encoding="utf-8"` for Windows compatibility
