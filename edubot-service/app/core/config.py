"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Plexa service configuration."""

    # AI — Primary (Gemini via OpenAI-compatible endpoint)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash-lite"
    GEMINI_TIMEOUT_SECONDS: int = 30

    # AI — Fallback (OpenRouter)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-lite-001"

    # Auth
    JWT_SECRET: str

    # Go Backend (for read-only tool calls)
    GO_BACKEND_URL: str = "http://backend-go:8080"
    GO_BACKEND_TIMEOUT: int = 8

    # Redis
    REDIS_URL: str = "redis://redis:6379/1"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # App
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    SESSION_TTL_SECONDS: int = 1800
    MAX_HISTORY_PAIRS: int = 10
    RATE_LIMIT_PER_MINUTE: int = 20

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()  # type: ignore[call-arg]
