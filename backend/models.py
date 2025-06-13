from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class GlobalCounter(Base):
    """Represents the single-row global counter table defined in the Liquibase changelog."""

    __tablename__ = "global_counter"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    value = Column(Integer, nullable=False, default=0)


class User(Base):
    """User table mirroring the structure created via Liquibase."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(320), nullable=False, unique=True, index=True)
    password_hash = Column(String(128), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
