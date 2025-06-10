"""Dependency that resolves the currently authenticated user.

Two modes are supported:

1. Stateless – validate HS256 JWT locally (faster, default).
2. Stateful  – call auth-server `/auth/session` endpoint (required if JWTs are
   RS256 or token revocation needs to be honoured).
"""

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import httpx

from .settings import settings
from .database import get_db
from . import crud


async def _validate_jwt(token: str) -> dict[str, str | None]:
    try:
        payload = jwt.decode(
            token,
            settings.ba_secret,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
        return {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
        }
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


async def _fetch_session(token: str) -> dict[str, str | None]:
    async with httpx.AsyncClient(base_url=settings.auth_public_url) as client:
        r = await client.get(
            "/auth/session",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid session")
    data = r.json()
    user = data.get("user", {}) if isinstance(data, dict) else {}
    return {
        "sub": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
    }


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: Session = Depends(get_db),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")

    token = authorization[len("Bearer "):].strip()

    # Branch based on settings.use_jwt
    if settings.use_jwt:
        info = await _validate_jwt(token)
    else:
        info = await _fetch_session(token)

    sub = info.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="sub missing")

    user = crud.get_or_create_user_from_sub(
        db,
        sub=sub,
        email=info.get("email"),
        name=info.get("name"),
    )
    return user
