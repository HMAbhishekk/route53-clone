from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from database import engine
import models
from routers import auth, zones, records, importexport

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Route53 Clone API",
    description="A functional clone of AWS Route53 REST API",
    version="1.0.0",
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)
app.include_router(importexport.router)

@app.get("/")
def root():
    return {"message": "Route53 Clone API is running", "docs": "/docs"}