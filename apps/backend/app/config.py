"""Application settings loaded from environment variables via pydantic-settings.

Nothing is hardcoded — every operational value is sourced from the environment
(or an `.env` file in development). API keys are never logged or returned.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ----- App -----
    APP_ENV: Literal["development", "production", "staging"] = "development"
    APP_PORT: int = 8000
    APP_VERSION: str = "1.0.0"
    FRONTEND_URL: str = "http://localhost:3000"

    # ----- LLM provider switch -----
    LLM_PROVIDER: Literal["groq", "claude"] = "groq"

    # Groq (free tier) — OpenAI-compatible
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_CLASSIFIER_MODEL: str = "llama-3.1-8b-instant"
    GROQ_REASONING_MODEL: str = "llama-3.3-70b-versatile"

    # Claude (prod)
    CLAUDE_API_KEY: str = ""
    CLAUDE_CLASSIFIER_MODEL: str = "claude-haiku-4-5"
    CLAUDE_REASONING_MODEL: str = "claude-sonnet-4"

    # ----- Search APIs -----
    SERPER_API_KEY: str = ""
    SERPER_BASE_URL: str = "https://google.serper.dev"
    TAVILY_API_KEY: str = ""
    TAVILY_BASE_URL: str = "https://api.tavily.com"

    # ----- Cache (Upstash Redis REST) -----
    UPSTASH_REDIS_URL: str = ""
    UPSTASH_REDIS_TOKEN: str = ""

    # ----- Database (Neon Postgres) -----
    DATABASE_URL: str = ""

    # ----- Rate limiting -----
    MAX_QUERIES_PER_DAY: int = 10

    # ----- Tunables -----
    HTTP_TIMEOUT_SECONDS: float = 8.0
    HTTP_MAX_ATTEMPTS: int = 3
    SEARCH_CACHE_TTL: int = 86400  # 24h
    PRODUCT_CACHE_TTL: int = 43200  # 12h
    CATEGORY_CACHE_TTL: int = 21600  # 6h
    TRENDING_TTL: int = 604800  # 7d
    MAX_PRODUCTS_TO_LLM: int = 10

    @property
    def cors_origins(self) -> list[str]:
        base = [
            "http://localhost:3000",
            "https://autocari.id",
            "https://www.autocari.id",
        ]
        if self.FRONTEND_URL and self.FRONTEND_URL not in base:
            base.append(self.FRONTEND_URL)
        return base

    @property
    def is_groq(self) -> bool:
        return self.LLM_PROVIDER == "groq"

    @property
    def is_claude(self) -> bool:
        return self.LLM_PROVIDER == "claude"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
