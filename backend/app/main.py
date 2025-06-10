from fastapi import Depends, FastAPI, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .deps import get_current_user
from .database import Base, engine, get_db
from . import crud

# Ensure DB tables exist for demo purposes (in prod use Alembic)
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Hello World Bootstrap Backend")

# Allow frontend dev server access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def me(user=Depends(get_current_user)):
    return {
        "id": str(user.id),
        "ba_user_id": str(user.ba_user_id),
        "full_name": user.full_name,
    }


@app.get("/counter")
def read_counter(db: Session = Depends(get_db)):
    counter = crud.get_counter(db)
    return {"value": counter.value}


@app.post("/counter/increment", status_code=status.HTTP_200_OK)
def increment_counter(db: Session = Depends(get_db)):
    counter = crud.increment_counter(db)
    return {"value": counter.value}
