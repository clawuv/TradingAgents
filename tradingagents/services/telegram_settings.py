"""Per-chat settings store for Telegram integrations."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass
import json
from pathlib import Path
from typing import Any

from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.services.analysis_service import DEFAULT_ANALYST_ORDER, list_supported_providers


@dataclass
class ChatSettings:
    """Mutable per-chat settings for Telegram-triggered analyses."""

    llm_provider: str
    output_language: str
    checkpoint_enabled: bool
    selected_analysts: list[str]

    def to_config_overrides(self) -> dict[str, Any]:
        return {
            "llm_provider": self.llm_provider,
            "output_language": self.output_language,
            "checkpoint_enabled": self.checkpoint_enabled,
        }


class TelegramSettingsStore:
    """Settings store keyed by Telegram chat ID with optional JSON persistence."""

    def __init__(
        self,
        base_config: dict[str, Any] | None = None,
        storage_path: str | Path | None = None,
    ) -> None:
        self._base_config = deepcopy(base_config or DEFAULT_CONFIG)
        self._settings_by_chat: dict[int, ChatSettings] = {}
        self._storage_path = Path(storage_path) if storage_path else None
        if self._storage_path:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            self._load()

    def get(self, chat_id: int) -> ChatSettings:
        if chat_id not in self._settings_by_chat:
            self._settings_by_chat[chat_id] = ChatSettings(
                llm_provider=self._base_config["llm_provider"],
                output_language=self._base_config.get("output_language", "English"),
                checkpoint_enabled=self._base_config.get("checkpoint_enabled", False),
                selected_analysts=list(DEFAULT_ANALYST_ORDER),
            )
        settings = self._settings_by_chat[chat_id]
        return ChatSettings(
            llm_provider=settings.llm_provider,
            output_language=settings.output_language,
            checkpoint_enabled=settings.checkpoint_enabled,
            selected_analysts=list(settings.selected_analysts),
        )

    def update_provider(self, chat_id: int, provider: str) -> ChatSettings:
        provider_value = provider.strip().lower()
        supported = set(list_supported_providers())
        if provider_value not in supported:
            raise ValueError(
                "Unsupported provider. Choose one of: " + ", ".join(sorted(supported))
            )
        settings = self.get(chat_id)
        settings.llm_provider = provider_value
        self._store(chat_id, settings)
        return self.get(chat_id)

    def update_language(self, chat_id: int, language: str) -> ChatSettings:
        language_value = language.strip()
        if not language_value:
            raise ValueError("Language cannot be empty.")
        settings = self.get(chat_id)
        settings.output_language = language_value
        self._store(chat_id, settings)
        return self.get(chat_id)

    def update_checkpoint(self, chat_id: int, enabled: bool) -> ChatSettings:
        settings = self.get(chat_id)
        settings.checkpoint_enabled = enabled
        self._store(chat_id, settings)
        return self.get(chat_id)

    def update_analysts(self, chat_id: int, analysts: list[str]) -> ChatSettings:
        normalized = {item.strip().lower() for item in analysts if item.strip()}
        ordered = [name for name in DEFAULT_ANALYST_ORDER if name in normalized]
        if not ordered:
            raise ValueError(
                "Analysts must include at least one of: "
                + ", ".join(DEFAULT_ANALYST_ORDER)
            )
        settings = self.get(chat_id)
        settings.selected_analysts = ordered
        self._store(chat_id, settings)
        return self.get(chat_id)

    def reset(self, chat_id: int) -> ChatSettings:
        """Reset one chat back to base defaults."""
        if chat_id in self._settings_by_chat:
            del self._settings_by_chat[chat_id]
            self._save()
        return self.get(chat_id)

    def _store(self, chat_id: int, settings: ChatSettings) -> None:
        self._settings_by_chat[chat_id] = settings
        self._save()

    def _load(self) -> None:
        if not self._storage_path or not self._storage_path.exists():
            return
        raw = json.loads(self._storage_path.read_text(encoding="utf-8"))
        for chat_id, payload in raw.items():
            self._settings_by_chat[int(chat_id)] = ChatSettings(
                llm_provider=payload["llm_provider"],
                output_language=payload["output_language"],
                checkpoint_enabled=payload["checkpoint_enabled"],
                selected_analysts=list(payload["selected_analysts"]),
            )

    def _save(self) -> None:
        if not self._storage_path:
            return
        serialized = {
            str(chat_id): asdict(settings)
            for chat_id, settings in self._settings_by_chat.items()
        }
        self._storage_path.write_text(
            json.dumps(serialized, indent=2, sort_keys=True),
            encoding="utf-8",
        )
