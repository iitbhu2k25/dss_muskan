# app/main.py
from fastapi import FastAPI
from app.api.router import router as api_router
from app.core.database import Base, engine

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI GWA Microservice")

app.include_router(api_router)
