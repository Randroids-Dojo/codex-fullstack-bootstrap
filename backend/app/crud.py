"""Lightweight CRUD helpers for the demo app."""

import uuid
from sqlalchemy.orm import Session

from . import models


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def get_or_create_user_from_sub(
    db: Session,
    *,
    sub: str,
    email: str | None = None,
    name: str | None = None,
) -> models.AppUser:
    """Return an AppUser linked to the Better-Auth `sub` (user id).

    • `sub` is the Better-Auth user UUID.  We store it in `ba_user_id`.
    • If no local profile exists we create one lazily so that the rest of the
      backend has a predictable `AppUser` object to work with.
    """

    user = (
        db.query(models.AppUser)
        .filter(models.AppUser.ba_user_id == sub)
        .first()
    )

    if user:
        return user

    user = models.AppUser(ba_user_id=sub, full_name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Global counter 🎛️
# ---------------------------------------------------------------------------


def get_counter(db: Session) -> models.GlobalCounter:
    counter = db.get(models.GlobalCounter, 1)
    if counter is None:
        counter = models.GlobalCounter(id=1, value=0)
        db.add(counter)
        db.commit()
        db.refresh(counter)
    return counter


def increment_counter(db: Session) -> models.GlobalCounter:
    counter = get_counter(db)
    counter.value += 1
    db.commit()
    db.refresh(counter)
    return counter
