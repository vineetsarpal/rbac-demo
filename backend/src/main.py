from fastapi import FastAPI, Depends, HTTPException, status
from src.database import engine, Base, get_db
from src import schemas, models, security
from src.config import settings
from src.routers import auth, user, role, permission, item
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Create tables on startup
# Base.metadata.create_all(bind=engine)

FRONTEND_URL = os.getenv("FRONTEND_URL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Routers ===
app.include_router(router=auth.router)
app.include_router(router=user.router)
app.include_router(router=role.router)
app.include_router(router=permission.router)
app.include_router(router=item.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}