"""FastAPI application entry point for Plexa service."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.redis_client import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    setup_logging()
    yield
    await close_redis()


app = FastAPI(
    title="Plexa Service",
    description="AI chatbot microservice for Eduplexo — OpenAI Agents SDK + Gemini",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Mount routes
app.include_router(api_router)
