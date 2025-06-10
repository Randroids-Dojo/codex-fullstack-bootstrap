from fastapi import Depends, Header, HTTPException, status

from jose import JWTError, jwt
import requests
from cachetools import TTLCache, cached

# Cache JWKS for 1 day (86400 seconds)
jwks_cache: TTLCache[str, dict] = TTLCache(maxsize=4, ttl=86400)


def _fetch_jwks(url: str) -> dict:
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    return resp.json()


# decorator caches based on URL argument
@cached(jwks_cache)
def _get_jwks(url: str) -> dict:
    return _fetch_jwks(url)
from sqlalchemy.orm import Session

from .settings import settings
from .database import get_db
from . import crud


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: Session = Depends(get_db),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")
    token = authorization[len("Bearer "):].strip()
    try:
        if settings.auth_jwks_url:
            jwks = _get_jwks(settings.auth_jwks_url)
            payload = jwt.decode(
                token,
                jwks,  # type: ignore[arg-type]
                algorithms=["RS256", "EdDSA", "ES256"],
                audience=settings.jwt_audience,
                issuer=settings.auth_issuer,
                options={"verify_aud": bool(settings.jwt_audience)},
            )
        else:
            # Fallback to symmetric verification (legacy path)
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=["HS256"],
                audience=settings.jwt_audience,
                issuer=settings.auth_issuer,
            )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    sub: str = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="sub missing")
    email = payload.get("email")
    name = payload.get("name")
    user = crud.get_or_create_user_from_sub(db, sub=sub, email=email, name=name)
    return user
