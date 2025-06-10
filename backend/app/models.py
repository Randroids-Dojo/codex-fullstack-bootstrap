"""SQLAlchemy models for the demo backend.

Only two tables are required:

1. `app_users`      – domain-specific profile linked to Better-Auth `ba_users`.
2. `global_counter` – single-row table holding the demo counter.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR

from .database import Base


def UUIDColumn(*, primary_key: bool = False, fk: str | None = None):  # type: ignore[valid-type]
    """Return a platform-portable UUID column.

    * Postgres – native UUID type.
    * Others    – CHAR(36).
    """

    try:
        coltype = PG_UUID(as_uuid=True)
    except Exception:  # pragma: no cover – not running with PG driver
        coltype = CHAR(36)

    args = []
    if fk:
        args.append(ForeignKey(fk, ondelete="CASCADE", onupdate="CASCADE"))

    return Column(coltype, *args, primary_key=primary_key, default=uuid.uuid4)


class AppUser(Base):
    __tablename__ = "app_users"

    id = UUIDColumn(primary_key=True)
    # UUID from Better-Auth users table. We don’t add an explicit FK because
    # the auth-server may run its migrations after the backend starts, which
    # would make `create_all()` fail on cold boot. The loose coupling avoids
    # container-start race conditions while still retaining the ID for joins
    # in application code.
    ba_user_id = UUIDColumn()

    full_name = Column(String, nullable=True)


class GlobalCounter(Base):
    __tablename__ = "global_counter"

    id = Column(Integer, primary_key=True, default=1)
    value = Column(Integer, default=0)
