from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from deps import get_db
import crud


app = FastAPI(title="Hello World Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/me")
def read_me(user: dict = Depends(crud.current_user)):
    """Return the currently authenticated user's basic profile."""
    return {"email": user["email"]}


@app.post("/counter/increment")
def increment_counter(db=Depends(get_db)):
    """Increment the global counter and return the new value."""
    value = crud.increment_counter(db)
    return {"value": value}
