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
    cors_origins_raw: str = (
        "http://127.0.0.1:5173,"
        "http://localhost:5173,"
        "http://127.0.0.1:3000,"
        "http://localhost:3000,"
        "http://127.0.0.1:4173,"
        "http://localhost:4173"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


settings = Settings()
