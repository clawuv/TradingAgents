from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "backend"
    env: str = "dev"
    database_url: str = "sqlite+pysqlite:///./data/trading_platform.db"
    default_account_id: str = "paper-main"
    max_single_position_pct: float = 0.05
    max_total_exposure_pct: float = 0.30
    max_daily_new_positions: int = 5
    kill_switch_enabled: bool = False
    research_generation_timeout_seconds: int = 1800
    research_runner_python: str | None = None
    cors_origins_raw: str = (
        "http://localhost:5173"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def resolved_research_runner_python(self) -> str:
        if self.research_runner_python:
            return self.research_runner_python
        return str(Path(__file__).resolve().parents[3] / "venv" / "bin" / "python")


settings = Settings()
