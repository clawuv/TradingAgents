from datetime import datetime

import pytest

from cli.config import (
    CLI_CONFIG,
    DEFAULT_ANALYSIS_DATE,
    DEFAULT_ANALYSTS,
    DEFAULT_LLM_PROVIDER,
    DEFAULT_OUTPUT_LANGUAGE,
    DEFAULT_RESEARCH_DEPTH,
    DEFAULT_TICKER,
)
from cli.utils import (
    get_default_analysts,
    get_default_llm_profile,
    get_provider_base_url,
    normalize_ticker_symbol,
    validate_research_depth,
)
from tradingagents.default_config import DEFAULT_CONFIG


def test_default_llm_provider_is_deepseek():
    assert DEFAULT_LLM_PROVIDER == "deepseek"
    assert CLI_CONFIG["default_llm_provider"] == "deepseek"
    assert DEFAULT_CONFIG["llm_provider"] == "deepseek"
    assert DEFAULT_CONFIG["output_language"] == "Chinese"


def test_default_llm_profile_uses_default_config_models():
    profile = get_default_llm_profile(DEFAULT_CONFIG, DEFAULT_LLM_PROVIDER)
    assert profile["llm_provider"] == "deepseek"
    assert profile["shallow_thinker"] == "deepseek-v4-flash"
    assert profile["deep_thinker"] == "deepseek-v4-pro"


def test_provider_base_url_known_provider():
    assert get_provider_base_url("deepseek") == "https://api.deepseek.com"


def test_provider_base_url_unknown_provider_raises():
    with pytest.raises(ValueError, match="Unsupported provider"):
        get_provider_base_url("not-real")


def test_default_output_language_and_date():
    assert DEFAULT_OUTPUT_LANGUAGE == "Chinese"
    assert CLI_CONFIG["default_output_language"] == "Chinese"
    assert CLI_CONFIG["auto_use_default_output_language"] is True
    assert CLI_CONFIG["auto_use_default_analysis_date"] is True
    datetime.strptime(DEFAULT_ANALYSIS_DATE, "%Y-%m-%d")


def test_default_analysts_and_research_depth():
    analysts = get_default_analysts(DEFAULT_ANALYSTS)
    assert [analyst.value for analyst in analysts] == DEFAULT_ANALYSTS
    assert CLI_CONFIG["auto_use_default_analysts"] is True
    assert CLI_CONFIG["auto_use_default_research_depth"] is True
    assert validate_research_depth(DEFAULT_RESEARCH_DEPTH) == 1


def test_invalid_research_depth_raises():
    with pytest.raises(ValueError, match="default_research_depth"):
        validate_research_depth(2)


def test_default_ticker_enabled():
    assert DEFAULT_TICKER == "SPY"
    assert CLI_CONFIG["default_ticker"] == "SPY"
    assert CLI_CONFIG["auto_use_default_ticker"] is True
    assert normalize_ticker_symbol(" spy ") == "SPY"
