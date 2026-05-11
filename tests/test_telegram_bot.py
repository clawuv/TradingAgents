from unittest.mock import MagicMock, patch

import pytest

from tradingagents.integrations.telegram_bot import (
    get_proxy_settings,
    get_runtime_limits,
    parse_allowed_chat_ids,
    parse_analyze_args,
    render_analysis_summary,
    render_job_summary,
    render_settings_summary,
    render_usage_summary,
    split_message,
    within_cooldown,
)
from tradingagents.services.analysis_service import AnalysisResult, AnalysisService
from tradingagents.services.telegram_jobs import TelegramJobStore
from tradingagents.services.telegram_settings import TelegramSettingsStore
from tradingagents.services.user_profile import UserProfileStore


def test_parse_analyze_args_defaults_date():
    ticker, trade_date = parse_analyze_args(["nvda"], default_date="2026-05-09")
    assert ticker == "NVDA"
    assert trade_date == "2026-05-09"


def test_parse_analyze_args_validates_date():
    with pytest.raises(ValueError, match="YYYY-MM-DD"):
        parse_analyze_args(["NVDA", "05/09/2026"])


def test_split_message_respects_limit():
    text = "alpha\nbeta\n" + ("x" * 5000)
    chunks = split_message(text, limit=1000)
    assert len(chunks) > 1
    assert all(len(chunk) <= 1000 for chunk in chunks)


def test_render_analysis_summary_includes_key_sections():
    result = AnalysisResult(
        ticker="NVDA",
        trade_date="2026-05-09",
        decision="Buy",
        final_trade_decision="**Rating**: Buy",
        investment_plan="**Recommendation**: Buy",
        trader_investment_plan="**Action**: Buy",
    )
    text = render_analysis_summary(result)
    assert "TradingAgents analysis for NVDA on 2026-05-09" in text
    assert "Signal: Buy" in text
    assert "Research Manager Plan:" in text
    assert "Trader Proposal:" in text


def test_render_settings_summary_includes_all_fields():
    store = TelegramSettingsStore(
        {
            "llm_provider": "openai",
            "output_language": "English",
            "checkpoint_enabled": False,
        }
    )
    settings = store.get(1)
    text = render_settings_summary(settings)
    assert "Provider: openai" in text
    assert "Output language: English" in text
    assert "Checkpoint enabled: False" in text


def test_render_job_summary_includes_status_and_error():
    store = TelegramJobStore()
    job = store.create_job(1, "NVDA", "2026-05-09")
    job = store.update_status(job.job_id, "failed", error="boom")
    text = render_job_summary(job)
    assert "job-" in text
    assert "[failed]" in text
    assert "Error: boom" in text


def test_render_usage_summary_includes_counts_and_last_context():
    store = UserProfileStore()
    settings_store = TelegramSettingsStore({"llm_provider": "openai", "output_language": "Chinese"})
    settings = settings_store.get(1)
    store.record_started(1, ticker="NVDA", trade_date="2026-05-09", job_id="job-0001", settings=settings)
    store.record_completed(1, signal="Buy", job_id="job-0001")
    text = render_usage_summary(store.get(1))
    assert "Analyses started: 1" in text
    assert "Analyses completed: 1" in text
    assert "Last ticker: NVDA" in text
    assert "Last signal: Buy" in text


def test_runtime_limits_respect_env(monkeypatch):
    monkeypatch.setenv("TELEGRAM_MAX_ACTIVE_JOBS_PER_CHAT", "2")
    monkeypatch.setenv("TELEGRAM_ANALYZE_COOLDOWN_SECONDS", "45")
    monkeypatch.setenv("TELEGRAM_RESTRICT_TO_ALLOWED_CHATS", "true")
    limits = get_runtime_limits()
    assert limits["max_active_jobs_per_chat"] == 2
    assert limits["analyze_cooldown_seconds"] == 45
    assert limits["restrict_to_allowed_chats"] is True


def test_proxy_settings_respect_env(monkeypatch):
    monkeypatch.setenv("TELEGRAM_PROXY_URL", "http://127.0.0.1:7897")
    monkeypatch.setenv("TELEGRAM_GET_UPDATES_PROXY_URL", "http://127.0.0.1:7897")
    settings = get_proxy_settings()
    assert settings["proxy"] == "http://127.0.0.1:7897"
    assert settings["get_updates_proxy"] == "http://127.0.0.1:7897"


def test_proxy_settings_fallback_to_standard_env(monkeypatch):
    monkeypatch.delenv("TELEGRAM_PROXY_URL", raising=False)
    monkeypatch.delenv("TELEGRAM_GET_UPDATES_PROXY_URL", raising=False)
    monkeypatch.setenv("HTTP_PROXY", "http://127.0.0.1:7897")
    monkeypatch.setenv("HTTPS_PROXY", "http://127.0.0.1:7897")
    settings = get_proxy_settings()
    assert settings["proxy"] == "http://127.0.0.1:7897"
    assert settings["get_updates_proxy"] == "http://127.0.0.1:7897"


def test_parse_allowed_chat_ids():
    assert parse_allowed_chat_ids("123, 456 ,789") == {123, 456, 789}
    assert parse_allowed_chat_ids("") == set()
    assert parse_allowed_chat_ids(None) == set()


def test_telegram_settings_store_updates_per_chat():
    store = TelegramSettingsStore(
        {
            "llm_provider": "openai",
            "output_language": "English",
            "checkpoint_enabled": False,
        }
    )
    store.update_provider(100, "anthropic")
    store.update_language(100, "Chinese")
    store.update_checkpoint(100, True)
    store.update_analysts(100, ["news", "market"])

    settings = store.get(100)
    assert settings.llm_provider == "anthropic"
    assert settings.output_language == "Chinese"
    assert settings.checkpoint_enabled is True
    assert settings.selected_analysts == ["market", "news"]

    other = store.get(200)
    assert other.llm_provider == "openai"
    assert other.output_language == "English"
    assert other.selected_analysts == ["market", "social", "news", "fundamentals"]


def test_telegram_settings_store_persists_to_disk(tmp_path):
    path = tmp_path / "settings.json"
    store = TelegramSettingsStore(
        {
            "llm_provider": "openai",
            "output_language": "English",
            "checkpoint_enabled": False,
        },
        storage_path=path,
    )
    store.update_provider(100, "anthropic")
    store.update_language(100, "Chinese")
    store.update_analysts(100, ["market", "news"])

    reloaded = TelegramSettingsStore(
        {
            "llm_provider": "openai",
            "output_language": "English",
            "checkpoint_enabled": False,
        },
        storage_path=path,
    )
    settings = reloaded.get(100)
    assert settings.llm_provider == "anthropic"
    assert settings.output_language == "Chinese"
    assert settings.selected_analysts == ["market", "news"]


def test_telegram_settings_store_reset_restores_defaults():
    store = TelegramSettingsStore(
        {
            "llm_provider": "openai",
            "output_language": "English",
            "checkpoint_enabled": False,
        }
    )
    store.update_provider(100, "anthropic")
    settings = store.reset(100)
    assert settings.llm_provider == "openai"
    assert settings.output_language == "English"


def test_telegram_settings_store_rejects_unknown_provider():
    store = TelegramSettingsStore({"llm_provider": "openai"})
    with pytest.raises(ValueError, match="Unsupported provider"):
        store.update_provider(1, "bogus")


def test_telegram_job_store_lists_most_recent_first():
    store = TelegramJobStore()
    first = store.create_job(1, "SPY", "2026-05-09")
    second = store.create_job(1, "NVDA", "2026-05-10")
    third = store.create_job(2, "AAPL", "2026-05-11")

    jobs = store.list_jobs(1)
    assert [job.job_id for job in jobs] == [second.job_id, first.job_id]
    assert store.get_job(third.job_id).ticker == "AAPL"
    assert store.count_active_jobs(1) == 2
    assert store.latest_job(1).job_id == second.job_id


def test_telegram_job_store_persists_to_disk(tmp_path):
    path = tmp_path / "jobs.json"
    store = TelegramJobStore(storage_path=path)
    first = store.create_job(1, "SPY", "2026-05-09")
    store.update_status(first.job_id, "completed")

    reloaded = TelegramJobStore(storage_path=path)
    jobs = reloaded.list_jobs(1)
    assert len(jobs) == 1
    assert jobs[0].job_id == first.job_id
    assert jobs[0].status == "completed"

    second = reloaded.create_job(1, "NVDA", "2026-05-10")
    assert second.job_id != first.job_id


def test_telegram_job_store_delete_chat_removes_jobs():
    store = TelegramJobStore()
    first = store.create_job(1, "SPY", "2026-05-09")
    store.create_job(1, "NVDA", "2026-05-10")
    store.delete_chat(1)
    assert store.list_jobs(1) == []
    assert store.get_job(first.job_id) is None


def test_within_cooldown_detects_recent_job():
    store = TelegramJobStore()
    job = store.create_job(1, "SPY", "2026-05-09")
    assert within_cooldown(job, 60) is True
    assert within_cooldown(job, 0) is False


def test_user_profile_store_persists_and_resets(tmp_path):
    path = tmp_path / "profiles.json"
    settings_store = TelegramSettingsStore({"llm_provider": "openai", "output_language": "Chinese"})
    settings = settings_store.get(1)
    store = UserProfileStore(storage_path=path)
    store.record_started(1, ticker="SPY", trade_date="2026-05-09", job_id="job-0001", settings=settings)
    store.record_failed(1, error="boom", job_id="job-0001")

    reloaded = UserProfileStore(storage_path=path)
    profile = reloaded.get(1)
    assert profile.analysis_started == 1
    assert profile.analysis_failed == 1
    assert profile.last_error == "boom"

    reloaded.reset(1)
    reset_profile = reloaded.get(1)
    assert reset_profile.analysis_started == 0
    assert reset_profile.last_ticker == ""


def test_analysis_service_normalizes_ticker_and_payload():
    fake_graph = MagicMock()
    fake_graph.propagate.return_value = (
        {
            "final_trade_decision": "**Rating**: Hold",
            "market_report": "market",
            "sentiment_report": "sentiment",
            "news_report": "news",
            "fundamentals_report": "fundamentals",
            "investment_plan": "plan",
            "trader_investment_plan": "proposal",
        },
        "Hold",
    )

    with patch.object(AnalysisService, "_create_graph", return_value=fake_graph):
        service = AnalysisService(base_config={"llm_provider": "openai"}, selected_analysts=("news", "market"))
        result = service.analyze("nvda", "2026-05-09")

    fake_graph.propagate.assert_called_once_with("NVDA", "2026-05-09")
    assert result.ticker == "NVDA"
    assert result.decision == "Hold"
    assert result.final_trade_decision == "**Rating**: Hold"
