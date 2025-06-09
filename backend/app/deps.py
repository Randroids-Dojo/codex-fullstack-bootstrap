from __future__ import annotations

import os, logging
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .crud import get_or_create_user_from_sub
from .database import get_db


AUTH_SERVER_URL = os.getenv("AUTH_SERVER_URL", "http://auth-server:4000")
SESSION_ENDPOINT = f"{AUTH_SERVER_URL}/api/auth/session"


log = logging.getLogger("backend.deps")


async def _fetch_session(cookies: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """Call Better Auth's /get-session endpoint and return its `data` payload.

    Returns None if the session is invalid or the auth-server is unreachable.
    """

    timeout = httpx.Timeout(3)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            resp = await client.get(SESSION_ENDPOINT, cookies=cookies)
        except Exception as exc:
            log.error("Auth-server unreachable: %s", exc, exc_info=True)
            return None

        if resp.status_code != 200:
            log.warning("Auth-server replied %s: %s", resp.status_code, resp.text[:200])
            return None

        try:
            body = resp.json()
        except ValueError:
            log.error("Invalid JSON from auth-server: %s", resp.text[:200])
            return None

        return body.get("data")


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    """FastAPI dependency that resolves the logged-in Better Auth user.

    1. Forward the incoming cookies to the auth-server.
    2. Validate the session and return the user dict.
    3. Persist / fetch a local SQLAlchemy User record for convenience.
    """

    session_data = await _fetch_session(request.cookies)
    if not session_data or not session_data.get("user"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    user_info = session_data["user"]

    # Better Auth returns at least an "id". Some setups also include "sub".
    sub = user_info.get("sub") or user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name")

    user = get_or_create_user_from_sub(db, sub=sub, email=email, name=name)
    return user
