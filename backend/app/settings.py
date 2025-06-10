from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
# Default to shared Postgres instance; fallback to local SQLite for quick
# unit tests.  The DATABASE_URL env var from `.env` / docker-compose points
# to the same database the auth-server uses.
    database_url: str = "sqlite:///./app.db"
    redis_url: str = "redis://localhost:6379/0"
    # Shared secret for HS256 JWTs issued by auth-server (Better-Auth)
    ba_secret: str = "dev-secret"

    jwt_issuer: str = "better-auth-demo"
    jwt_audience: str = "fastapi-backend"

    # URL where the auth-server is reachable from inside the backend container
    auth_public_url: str = "http://auth-server:4000"

    # Toggle: verify JWT locally (stateless) or call /auth/session (stateful)
    use_jwt: bool = True

    class Config(SettingsConfigDict):
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # ignore unrelated env vars (e.g., from Vite)


@lru_cache()
def get_settings() -> Settings:  # pragma: no cover
    return Settings()  # type: ignore[arg-type]


settings = get_settings()
