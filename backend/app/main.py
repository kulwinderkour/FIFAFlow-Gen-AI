import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import init_db
from app.routers import assistant, operations, transport, emergency
from app.services.gemini_service import HAS_GEMINI_KEY
import uvicorn

# Rate limiter — keyed by IP address (200 req/min global, 10/min on AI endpoints)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="StadiumMind API",
    description="AI Stadium Operations & Fan Intelligence Platform for FIFA World Cup 2026",
    version="1.0.0"
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS — restrict to known origins; set FRONTEND_ORIGIN env var for production
ALLOWED_ORIGINS = list(set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Initialize database schemas on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Mount API Routers
app.include_router(assistant.router, prefix="/api")
app.include_router(operations.router, prefix="/api")
app.include_router(transport.router, prefix="/api")
app.include_router(emergency.router, prefix="/api")

@app.get("/api/system/status", tags=["System"])
def get_system_status():
    """Returns whether the Gemini API key is configured in the backend environment."""
    return {
        "gemini_api_configured": HAS_GEMINI_KEY
    }

@app.get("/", tags=["System"])
def read_root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "StadiumMind API Backend",
        "version": "1.0.0",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
