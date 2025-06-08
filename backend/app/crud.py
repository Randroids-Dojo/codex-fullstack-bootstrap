from sqlalchemy.orm import Session

from . import models


def get_or_create_user_from_sub(db: Session, sub: str, email: str | None = None, name: str | None = None) -> models.User:
    user = db.query(models.User).filter(models.User.sub == sub).first()
    if user:
        return user
    user = models.User(sub=sub, email=email, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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
