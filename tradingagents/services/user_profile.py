"""Persistent per-chat usage and preference memory for Telegram integrations."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
import json
from pathlib import Path

from tradingagents.services.telegram_settings import ChatSettings


@dataclass
class UserProfile:
    """Summarized long-lived memory for a Telegram chat/user."""

    analysis_started: int = 0
    analysis_completed: int = 0
    analysis_failed: int = 0
    last_ticker: str = ""
    last_trade_date: str = ""
    last_signal: str = ""
    last_provider: str = ""
    last_language: str = ""
    last_analysts: list[str] | None = None
    last_job_id: str = ""
    last_error: str = ""
    updated_at: str = ""

    def __post_init__(self) -> None:
        if self.last_analysts is None:
            self.last_analysts = []


class UserProfileStore:
    """JSON-backed user profile store keyed by Telegram chat ID."""

    def __init__(self, storage_path: str | Path | None = None) -> None:
        self._profiles: dict[int, UserProfile] = {}
        self._storage_path = Path(storage_path) if storage_path else None
        if self._storage_path:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            self._load()

    def get(self, chat_id: int) -> UserProfile:
        if chat_id not in self._profiles:
            self._profiles[chat_id] = UserProfile()
        return UserProfile(**asdict(self._profiles[chat_id]))

    def record_started(
        self,
        chat_id: int,
        *,
        ticker: str,
        trade_date: str,
        job_id: str,
        settings: ChatSettings,
    ) -> UserProfile:
        profile = self.get(chat_id)
        profile.analysis_started += 1
        profile.last_ticker = ticker
        profile.last_trade_date = trade_date
        profile.last_provider = settings.llm_provider
        profile.last_language = settings.output_language
        profile.last_analysts = list(settings.selected_analysts)
        profile.last_job_id = job_id
        profile.last_error = ""
        profile.updated_at = self._now()
        return self._store(chat_id, profile)

    def record_completed(self, chat_id: int, *, signal: str, job_id: str) -> UserProfile:
        profile = self.get(chat_id)
        profile.analysis_completed += 1
        profile.last_signal = signal
        profile.last_job_id = job_id
        profile.last_error = ""
        profile.updated_at = self._now()
        return self._store(chat_id, profile)

    def record_failed(self, chat_id: int, *, error: str, job_id: str) -> UserProfile:
        profile = self.get(chat_id)
        profile.analysis_failed += 1
        profile.last_job_id = job_id
        profile.last_error = error
        profile.updated_at = self._now()
        return self._store(chat_id, profile)

    def reset(self, chat_id: int) -> None:
        if chat_id in self._profiles:
            del self._profiles[chat_id]
            self._save()

    def _store(self, chat_id: int, profile: UserProfile) -> UserProfile:
        self._profiles[chat_id] = profile
        self._save()
        return self.get(chat_id)

    def _load(self) -> None:
        if not self._storage_path or not self._storage_path.exists():
            return
        raw = json.loads(self._storage_path.read_text(encoding="utf-8"))
        self._profiles = {
            int(chat_id): UserProfile(**payload)
            for chat_id, payload in raw.items()
        }

    def _save(self) -> None:
        if not self._storage_path:
            return
        serialized = {
            str(chat_id): asdict(profile)
            for chat_id, profile in self._profiles.items()
        }
        self._storage_path.write_text(
            json.dumps(serialized, indent=2, sort_keys=True),
            encoding="utf-8",
        )

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
