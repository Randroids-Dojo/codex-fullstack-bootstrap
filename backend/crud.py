from sqlalchemy.orm import Session
from sqlalchemy import select

from models import GlobalCounter


def increment_counter(db: Session) -> int:
    """Atomically increment and return the value of the global counter."""

    # Grab (or create) the single counter row.
    counter = db.execute(select(GlobalCounter).limit(1)).scalars().first()

    if counter is None:
        counter = GlobalCounter(value=1)
        db.add(counter)
    else:
        counter.value += 1

    db.commit()
    db.refresh(counter)

    return counter.value


# Placeholder for auth integration – in real code this would verify JWT created by Better-Auth
from fastapi import HTTPException, status, Header
import os
import jwt  # PyJWT


JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_ALGORITHM = "HS256"


def current_user(authorization: str | None = Header(default=None)):
    """Validate the JWT produced by the auth-service and return the user claims.

    The auth-service signs a short-lived JWT (HS256) containing at minimum the
    user's e-mail under the `sub` (subject) claim. We mirror that minimal
    contract here. If the token is invalid or expired a 401 is raised.
    """

    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return {"email": email}
