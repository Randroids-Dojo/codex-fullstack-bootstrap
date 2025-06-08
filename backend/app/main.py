from fastapi import Depends, FastAPI, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .deps import get_current_user
from .database import Base, engine, get_db
from . import crud

# Ensure DB tables exist for demo purposes (in prod use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hello World Bootstrap Backend")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def me(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "sub": user.sub,
        "email": user.email,
        "name": user.name,
    }


@app.get("/counter")
def read_counter(db: Session = Depends(get_db)):
    counter = crud.get_counter(db)
    return {"value": counter.value}


@app.post("/counter/increment", status_code=status.HTTP_200_OK)
def increment_counter(db: Session = Depends(get_db)):
    counter = crud.increment_counter(db)
    return {"value": counter.value}
