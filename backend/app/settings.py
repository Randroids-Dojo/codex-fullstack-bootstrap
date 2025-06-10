from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "dev-secret"
    auth_issuer: str = "better-auth-demo"
    jwt_audience: str = "fastapi-backend"
    auth_jwks_url: str | None = None  # e.g. http://localhost:4000/auth/jwks.json

    class Config(SettingsConfigDict):
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:  # pragma: no cover
    return Settings()  # type: ignore[arg-type]


settings = get_settings()
