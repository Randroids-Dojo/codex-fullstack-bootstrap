import logging
from fastapi import Depends, FastAPI, status, Request
from sqlalchemy.orm import Session

from .deps import get_current_user
from .database import Base, engine, get_db
from . import crud

# Ensure DB tables exist for demo purposes (in prod use Alembic)
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware


# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("backend")


async def log_requests(request: Request, call_next):
    log.info("► %s %s", request.method, request.url.path)
    response = await call_next(request)
    log.info("◄ %s %s → %s", request.method, request.url.path, response.status_code)
    return response


middleware: list[Middleware] = [
    Middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
    Middleware(log_requests),
]


app = FastAPI(title="Hello World Bootstrap Backend", middleware=middleware)


@app.get("/health")
def health():
    return {"status": "ok"}


# lightweight ping endpoint for service discovery / health debugging
@app.get("/debug/ping")
def ping():
    return {"pong": True}


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
