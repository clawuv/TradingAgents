"""Telegram bot adapter for TradingAgents."""

from __future__ import annotations

import asyncio
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.services.analysis_service import (
    AnalysisResult,
    AnalysisService,
    list_supported_providers,
)
from tradingagents.services.telegram_jobs import AnalysisJob, TelegramJobStore
from tradingagents.services.telegram_settings import ChatSettings, TelegramSettingsStore
from tradingagents.services.user_profile import UserProfile, UserProfileStore

try:
    from telegram import Update
    from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
except ImportError:  # pragma: no cover - handled at runtime in main()
    Update = Any
    ApplicationBuilder = None
    CommandHandler = None
    ContextTypes = None


MAX_TELEGRAM_MESSAGE_LEN = 4000
DEFAULT_TELEGRAM_ANALYSTS = ("market", "social", "news", "fundamentals")
MAX_ACTIVE_JOBS_PER_CHAT = 1
ANALYZE_COOLDOWN_SECONDS = 30


def parse_analyze_args(args: list[str], *, default_date: str | None = None) -> tuple[str, str]:
    """Parse `/analyze` command arguments into a ticker and trade date."""
    if not args:
        raise ValueError("Usage: /analyze <TICKER> [YYYY-MM-DD]")

    ticker = args[0].strip().upper()
    if not ticker:
        raise ValueError("Ticker cannot be empty.")

    trade_date = args[1].strip() if len(args) > 1 else (default_date or date.today().isoformat())
    try:
        datetime.strptime(trade_date, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError("Trade date must be in YYYY-MM-DD format.") from exc

    return ticker, trade_date


def split_message(text: str, limit: int = MAX_TELEGRAM_MESSAGE_LEN) -> list[str]:
    """Split long text into Telegram-safe chunks while preferring line breaks."""
    if len(text) <= limit:
        return [text]

    chunks: list[str] = []
    remaining = text
    while len(remaining) > limit:
        split_at = remaining.rfind("\n", 0, limit)
        if split_at <= 0:
            split_at = limit
        chunks.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].lstrip()
    if remaining:
        chunks.append(remaining)
    return chunks


def render_analysis_summary(result: AnalysisResult) -> str:
    """Render a compact Telegram-friendly summary."""
    sections = [
        f"TradingAgents analysis for {result.ticker} on {result.trade_date}",
        f"Signal: {result.decision}",
        "",
        "Final Decision:",
        result.final_trade_decision.strip(),
    ]

    if result.investment_plan:
        sections.extend(["", "Research Manager Plan:", result.investment_plan.strip()])

    if result.trader_investment_plan:
        sections.extend(["", "Trader Proposal:", result.trader_investment_plan.strip()])

    return "\n".join(sections).strip()


def render_settings_summary(settings: ChatSettings) -> str:
    """Render chat settings for human-friendly replies."""
    return "\n".join(
        [
            f"Provider: {settings.llm_provider}",
            f"Output language: {settings.output_language}",
            f"Checkpoint enabled: {settings.checkpoint_enabled}",
            f"Analysts: {', '.join(settings.selected_analysts)}",
        ]
    )


def render_job_summary(job: AnalysisJob) -> str:
    """Render one job status line item."""
    summary = (
        f"{job.job_id}: {job.ticker} on {job.trade_date} "
        f"[{job.status}] created {job.created_at}"
    )
    if job.error:
        summary += f"\nError: {job.error}"
    return summary


def render_usage_summary(profile: UserProfile) -> str:
    """Render persistent usage stats for a Telegram chat."""
    return "\n".join(
        [
            f"Analyses started: {profile.analysis_started}",
            f"Analyses completed: {profile.analysis_completed}",
            f"Analyses failed: {profile.analysis_failed}",
            f"Last ticker: {profile.last_ticker or 'N/A'}",
            f"Last trade date: {profile.last_trade_date or 'N/A'}",
            f"Last signal: {profile.last_signal or 'N/A'}",
            f"Last provider: {profile.last_provider or 'N/A'}",
            f"Last language: {profile.last_language or 'N/A'}",
            f"Last analysts: {', '.join(profile.last_analysts) if profile.last_analysts else 'N/A'}",
            f"Last job: {profile.last_job_id or 'N/A'}",
            f"Last error: {profile.last_error or 'N/A'}",
            f"Updated at: {profile.updated_at or 'N/A'}",
        ]
    )


def parse_bool_env(var_name: str, default: bool) -> bool:
    """Parse a boolean environment variable."""
    value = os.getenv(var_name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_runtime_limits() -> dict[str, int | bool]:
    """Read Telegram runtime controls from environment variables."""
    return {
        "max_active_jobs_per_chat": int(
            os.getenv("TELEGRAM_MAX_ACTIVE_JOBS_PER_CHAT", str(MAX_ACTIVE_JOBS_PER_CHAT))
        ),
        "analyze_cooldown_seconds": int(
            os.getenv("TELEGRAM_ANALYZE_COOLDOWN_SECONDS", str(ANALYZE_COOLDOWN_SECONDS))
        ),
        "restrict_to_allowed_chats": parse_bool_env("TELEGRAM_RESTRICT_TO_ALLOWED_CHATS", False),
    }


def get_proxy_settings() -> dict[str, str | None]:
    """Read Telegram proxy configuration from environment.

    Preference order:
    1. Telegram-specific overrides
    2. Standard HTTPS/HTTP proxy environment variables
    """
    standard_proxy = (
        os.getenv("HTTPS_PROXY")
        or os.getenv("https_proxy")
        or os.getenv("HTTP_PROXY")
        or os.getenv("http_proxy")
    )
    return {
        "proxy": os.getenv("TELEGRAM_PROXY_URL") or standard_proxy,
        "get_updates_proxy": os.getenv("TELEGRAM_GET_UPDATES_PROXY_URL") or standard_proxy,
    }


def parse_allowed_chat_ids(raw: str | None) -> set[int]:
    """Parse comma-separated Telegram chat IDs from env."""
    if not raw:
        return set()
    chat_ids: set[int] = set()
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        chat_ids.add(int(item))
    return chat_ids


def within_cooldown(job: AnalysisJob | None, cooldown_seconds: int) -> bool:
    """Return True when a new analysis should be throttled."""
    if job is None:
        return False
    last_seen = datetime.strptime(job.created_at, "%Y-%m-%d %H:%M:%SZ")
    elapsed = (datetime.utcnow() - last_seen).total_seconds()
    return elapsed < cooldown_seconds


async def reply_long_message(message_target: Any, text: str, *, chat_id: int | None = None) -> None:
    """Send a long reply as multiple Telegram messages."""
    for chunk in split_message(text):
        if chat_id is None:
            await message_target.reply_text(chunk)
        else:
            await message_target.send_message(chat_id=chat_id, text=chunk)


async def ensure_chat_allowed(update: Update, context: Any) -> bool:
    """Enforce optional allowlist restrictions before command execution."""
    limits = context.application.bot_data["runtime_limits"]
    if not limits["restrict_to_allowed_chats"]:
        return True

    allowed_chat_ids: set[int] = context.application.bot_data["allowed_chat_ids"]
    chat_id = update.effective_chat.id
    if chat_id in allowed_chat_ids:
        return True

    if update.message is not None:
        await update.message.reply_text("This bot is not enabled for this chat.")
    return False


async def start_command(update: Update, context: Any) -> None:
    del context
    if update.message is None:
        return
    await update.message.reply_text(
        "TradingAgents Telegram bot is ready.\n"
        "Use /analyze <TICKER> [YYYY-MM-DD] to run a market analysis.\n"
        "Use /help for available commands."
    )


async def help_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return
    await update.message.reply_text(
        "Commands:\n"
        "/analyze <TICKER> [YYYY-MM-DD] - run a TradingAgents analysis\n"
        "/config - show bot defaults\n"
        "/providers - list supported LLM providers\n"
        "/set_provider <provider> - set the LLM provider for this chat\n"
        "/set_language <language> - set analyst output language for this chat\n"
        "/set_analysts <comma-separated> - set analysts for this chat\n"
        "/set_checkpoint <on|off> - enable or disable checkpoint resume\n"
        "/status [job_id] - show recent jobs or one specific job\n"
        "/usage - show persistent usage stats for this chat\n"
        "/reset - reset this chat's settings, usage memory, and jobs\n"
        "/help - show this help message"
    )


async def providers_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return
    providers = ", ".join(list_supported_providers())
    await update.message.reply_text(f"Supported LLM providers: {providers}")


async def config_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return

    service: AnalysisService = context.application.bot_data["analysis_service"]
    store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    settings = store.get(update.effective_chat.id)
    config = service.base_config
    await update.message.reply_text(
        "\n".join(
            [
                "Current Telegram bot defaults:",
                f"Provider: {config['llm_provider']}",
                f"Quick model: {config['quick_think_llm']}",
                f"Deep model: {config['deep_think_llm']}",
                f"Checkpoint enabled: {config['checkpoint_enabled']}",
                f"Analysts: {', '.join(service.selected_analysts)}",
                "",
                "Current chat settings:",
                render_settings_summary(settings),
            ]
        )
    )


async def set_provider_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return
    if not context.args:
        await update.message.reply_text("Usage: /set_provider <provider>")
        return

    store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    try:
        settings = store.update_provider(update.effective_chat.id, context.args[0])
    except ValueError as exc:
        await update.message.reply_text(str(exc))
        return
    await update.message.reply_text("Provider updated.\n" + render_settings_summary(settings))


async def set_language_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return
    if not context.args:
        await update.message.reply_text("Usage: /set_language <language>")
        return

    store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    try:
        settings = store.update_language(update.effective_chat.id, " ".join(context.args))
    except ValueError as exc:
        await update.message.reply_text(str(exc))
        return
    await update.message.reply_text("Language updated.\n" + render_settings_summary(settings))


async def set_analysts_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return
    if not context.args:
        await update.message.reply_text(
            "Usage: /set_analysts market,social,news,fundamentals"
        )
        return

    raw = " ".join(context.args)
    requested = [item.strip() for item in raw.split(",")]

    store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    try:
        settings = store.update_analysts(update.effective_chat.id, requested)
    except ValueError as exc:
        await update.message.reply_text(str(exc))
        return
    await update.message.reply_text("Analysts updated.\n" + render_settings_summary(settings))


async def set_checkpoint_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return
    if not context.args:
        await update.message.reply_text("Usage: /set_checkpoint <on|off>")
        return

    value = context.args[0].strip().lower()
    if value not in {"on", "off"}:
        await update.message.reply_text("Checkpoint must be 'on' or 'off'.")
        return

    store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    settings = store.update_checkpoint(update.effective_chat.id, value == "on")
    await update.message.reply_text("Checkpoint setting updated.\n" + render_settings_summary(settings))


async def status_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return

    job_store: TelegramJobStore = context.application.bot_data["job_store"]
    if context.args:
        job = job_store.get_job(context.args[0].strip())
        if job is None or job.chat_id != update.effective_chat.id:
            await update.message.reply_text("Job not found for this chat.")
            return
        await update.message.reply_text(render_job_summary(job))
        return

    jobs = job_store.list_jobs(update.effective_chat.id)
    if not jobs:
        await update.message.reply_text("No jobs yet for this chat.")
        return

    await update.message.reply_text(
        "Recent jobs:\n" + "\n\n".join(render_job_summary(job) for job in jobs)
    )


async def usage_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return

    profile_store: UserProfileStore = context.application.bot_data["profile_store"]
    profile = profile_store.get(update.effective_chat.id)
    await update.message.reply_text("Usage for this chat:\n" + render_usage_summary(profile))


async def reset_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return

    chat_id = update.effective_chat.id
    settings_store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    job_store: TelegramJobStore = context.application.bot_data["job_store"]
    profile_store: UserProfileStore = context.application.bot_data["profile_store"]

    settings = settings_store.reset(chat_id)
    job_store.delete_chat(chat_id)
    profile_store.reset(chat_id)
    await update.message.reply_text(
        "This chat has been reset.\n"
        "Settings restored to defaults, usage memory cleared, and job history removed.\n\n"
        + render_settings_summary(settings)
    )


async def _run_analysis_job(
    *,
    application: Any,
    chat_id: int,
    job_id: str,
    ticker: str,
    trade_date: str,
    service: AnalysisService,
    settings: ChatSettings,
) -> None:
    """Execute one analysis job in the background and push results to Telegram."""
    job_store: TelegramJobStore = application.bot_data["job_store"]
    profile_store: UserProfileStore = application.bot_data["profile_store"]
    job_store.update_status(job_id, "running")

    try:
        result = await asyncio.to_thread(
            service.analyze,
            ticker,
            trade_date,
            config_overrides=settings.to_config_overrides(),
            selected_analysts=settings.selected_analysts,
        )
    except Exception as exc:  # pragma: no cover - depends on runtime env
        job_store.update_status(job_id, "failed", error=str(exc))
        profile_store.record_failed(chat_id, error=str(exc), job_id=job_id)
        await application.bot.send_message(
            chat_id=chat_id,
            text=f"{job_id} failed for {ticker} on {trade_date}.\nError: {exc}",
        )
        return

    job_store.update_status(job_id, "completed")
    profile_store.record_completed(chat_id, signal=result.decision, job_id=job_id)
    await reply_long_message(
        application.bot,
        f"{job_id} completed.\n\n" + render_analysis_summary(result),
        chat_id=chat_id,
    )


async def analyze_command(update: Update, context: Any) -> None:
    if update.message is None:
        return
    if not await ensure_chat_allowed(update, context):
        return

    try:
        ticker, trade_date = parse_analyze_args(context.args)
    except ValueError as exc:
        await update.message.reply_text(str(exc))
        return

    service: AnalysisService = context.application.bot_data["analysis_service"]
    store: TelegramSettingsStore = context.application.bot_data["settings_store"]
    job_store: TelegramJobStore = context.application.bot_data["job_store"]
    limits = context.application.bot_data["runtime_limits"]
    active_jobs = job_store.count_active_jobs(update.effective_chat.id)
    if active_jobs >= limits["max_active_jobs_per_chat"]:
        await update.message.reply_text(
            "You already have an analysis in progress for this chat. "
            "Wait for it to finish or check /status."
        )
        return

    latest_job = job_store.latest_job(update.effective_chat.id)
    cooldown_seconds = limits["analyze_cooldown_seconds"]
    if within_cooldown(latest_job, cooldown_seconds):
        await update.message.reply_text(
            f"Please wait before starting another analysis. Cooldown: {cooldown_seconds}s."
        )
        return

    settings = store.get(update.effective_chat.id)
    job = job_store.create_job(update.effective_chat.id, ticker, trade_date)
    profile_store: UserProfileStore = context.application.bot_data["profile_store"]
    profile_store.record_started(
        update.effective_chat.id,
        ticker=ticker,
        trade_date=trade_date,
        job_id=job.job_id,
        settings=settings,
    )
    await update.message.reply_text(
        f"Queued {job.job_id} for {ticker} on {trade_date}. "
        "I'll send the result here when it finishes."
    )

    context.application.create_task(
        _run_analysis_job(
            application=context.application,
            chat_id=update.effective_chat.id,
            job_id=job.job_id,
            ticker=ticker,
            trade_date=trade_date,
            service=service,
            settings=settings,
        )
    )


def build_application(token: str, *, analysis_service: AnalysisService | None = None) -> Any:
    """Create the Telegram application and register command handlers."""
    if ApplicationBuilder is None or CommandHandler is None:
        raise RuntimeError(
            "python-telegram-bot is not installed. "
            "Run `pip install python-telegram-bot` or reinstall the project dependencies."
        )

    proxy_settings = get_proxy_settings()
    builder = ApplicationBuilder().token(token)
    if proxy_settings["proxy"]:
        builder = builder.proxy(proxy_settings["proxy"])
    if proxy_settings["get_updates_proxy"]:
        builder = builder.get_updates_proxy(proxy_settings["get_updates_proxy"])

    application = builder.build()
    service = analysis_service or AnalysisService(
        base_config=DEFAULT_CONFIG.copy(),
        selected_analysts=DEFAULT_TELEGRAM_ANALYSTS,
    )
    telegram_dir = Path(service.base_config["data_cache_dir"]) / "telegram"
    application.bot_data["analysis_service"] = service
    application.bot_data["settings_store"] = TelegramSettingsStore(
        service.base_config,
        storage_path=telegram_dir / "settings.json",
    )
    application.bot_data["job_store"] = TelegramJobStore(
        storage_path=telegram_dir / "jobs.json",
    )
    application.bot_data["profile_store"] = UserProfileStore(
        storage_path=telegram_dir / "profiles.json",
    )
    application.bot_data["runtime_limits"] = get_runtime_limits()
    application.bot_data["allowed_chat_ids"] = parse_allowed_chat_ids(
        os.getenv("TELEGRAM_ALLOWED_CHAT_IDS")
    )
    application.bot_data["proxy_settings"] = proxy_settings
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("providers", providers_command))
    application.add_handler(CommandHandler("config", config_command))
    application.add_handler(CommandHandler("set_provider", set_provider_command))
    application.add_handler(CommandHandler("set_language", set_language_command))
    application.add_handler(CommandHandler("set_analysts", set_analysts_command))
    application.add_handler(CommandHandler("set_checkpoint", set_checkpoint_command))
    application.add_handler(CommandHandler("status", status_command))
    application.add_handler(CommandHandler("usage", usage_command))
    application.add_handler(CommandHandler("reset", reset_command))
    application.add_handler(CommandHandler("analyze", analyze_command))
    return application


def main() -> None:
    """Entry point for the Telegram bot."""
    load_dotenv()
    load_dotenv(".env.enterprise", override=False)

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set.")

    application = build_application(token)
    application.run_polling()
