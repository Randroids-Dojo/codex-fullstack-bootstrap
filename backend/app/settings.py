from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    redis_url: str = "redis://localhost:6379/0"
    ba_secret: str = "dev-secret"
    auth_public_url: str = "http://localhost:4000"
    use_jwt: bool = True
    jwt_issuer: str = "better-auth-demo"
    jwt_audience: str = "fastapi-backend"

    class Config(SettingsConfigDict):
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:  # pragma: no cover
    return Settings()  # type: ignore[arg-type]


settings = get_settings()
