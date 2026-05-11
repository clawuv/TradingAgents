from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "backend"
    env: str = "dev"
    database_url: str = "sqlite+pysqlite:///./data/trading_platform.db"
    default_account_id: str = "paper-main"
    max_single_position_pct: float = 0.05
    max_total_exposure_pct: float = 0.30
    max_daily_new_positions: int = 5
    kill_switch_enabled: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
