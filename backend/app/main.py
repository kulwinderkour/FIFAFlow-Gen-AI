import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.limiter import limiter
from app.database import init_db
from app.routers import assistant, operations, transport, emergency
from app.services.gemini_service import HAS_GEMINI_KEY
import uvicorn

# Initialize database schemas on startup with lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="StadiumMind API",
    description="AI Stadium Operations & Fan Intelligence Platform for FIFA World Cup 2026",
    version="1.0.0",
    lifespan=lifespan
)

# Attach rate limiter instance and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add SlowAPIMiddleware to ensure rate limit headers are added to responses
app.add_middleware(SlowAPIMiddleware)

# Custom HTTP Security Headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://images.unsplash.com; "
        "connect-src 'self' ws: wss: http: https:;"
    )
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    # Obfuscate Server header
    response.headers["Server"] = "StadiumMindServer"
    return response

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
