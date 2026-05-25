"""API router registration."""

from fastapi import APIRouter

from app.api.chat import router as chat_router
from app.api.public_chat import router as public_chat_router

api_router = APIRouter()
api_router.include_router(chat_router)
api_router.include_router(public_chat_router)
