from sqlalchemy import Column, Integer, String

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    sub = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, index=True)
    name = Column(String, nullable=True)


class GlobalCounter(Base):
    __tablename__ = "global_counter"

    id = Column(Integer, primary_key=True, default=1)
    value = Column(Integer, default=0)
