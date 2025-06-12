"""Dependency helpers used by route handlers.

We support two auth strategies controlled via the USE_JWT env var:

* Stateless JWT verification (default)
* Stateful session lookup via the Better-Auth `/auth/session` endpoint
"""

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import httpx

from .settings import settings
from .database import get_db
from . import crud


async def _get_user_from_jwt(db: Session, token: str):
    try:
        payload = jwt.decode(
            token,
            settings.ba_secret,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    sub: str | None = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="sub missing")

    email: str | None = payload.get("email")
    name: str | None = payload.get("name")
    return crud.get_or_create_user_from_sub(db, sub=sub, email=email, name=name)


async def _get_user_from_session(db: Session, authorization_header: str):
    async with httpx.AsyncClient(base_url=settings.auth_public_url) as client:
        r = await client.get("/auth/session", headers={"Authorization": authorization_header})
    if r.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid session")

    data = r.json()
    user_info = data.get("user", {})
    sub = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="sub missing")

    return crud.get_or_create_user_from_sub(db, sub=sub, email=email, name=name)


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: Session = Depends(get_db),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")

    if settings.use_jwt:
        token = authorization[len("Bearer "):].strip()
        return await _get_user_from_jwt(db, token)

    # Session-based validation
    return await _get_user_from_session(db, authorization)
