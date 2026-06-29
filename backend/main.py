from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth, zones, records, importexport
from sqlalchemy import text

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Migration: add user_id column if it doesn't exist
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE hosted_zones ADD COLUMN user_id TEXT"))
        conn.commit()
        print("Migration: added user_id column")
    except Exception:
        pass  # Column already exists

app = FastAPI(
    title="Route53 Clone API",
    description="A functional clone of AWS Route53 REST API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)
app.include_router(importexport.router)

@app.get("/")
def root():
    return {"message": "Route53 Clone API is running", "docs": "/docs"}