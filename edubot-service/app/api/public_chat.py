"""Public chat endpoint for the landing page chatbot (no auth required)."""

from __future__ import annotations

import json
import uuid

import structlog
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.landing_prompt import LANDING_SYSTEM_PROMPT
from app.core.config import settings
from app.middleware.sanitizer import sanitize_message

logger = structlog.get_logger()

router = APIRouter(prefix="/public-chat", tags=["public-chat"])


class PublicChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: str = ""
    language: str = "english"


class PublicChatResponse(BaseModel):
    reply: str
    session_id: str


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/message", response_model=PublicChatResponse)
async def public_message(body: PublicChatRequest):
    """Non-streaming public chat for landing page visitors."""
    clean = sanitize_message(body.message)
    if not clean:
        raise HTTPException(status_code=400, detail="Please type a message.")

    session_id = body.session_id or f"pub_{uuid.uuid4().hex[:12]}"

    try:
        reply = await _call_gemini(clean, body.language)
    except Exception as e:
        logger.error("public_chat_error", error=str(e))
        reply = "I'm having trouble connecting right now. Please visit https://www.eduplexo.com/ for more information or try again shortly."

    return PublicChatResponse(reply=reply, session_id=session_id)


@router.post("/stream")
async def public_stream(body: PublicChatRequest):
    """SSE streaming public chat for landing page visitors."""
    clean = sanitize_message(body.message)
    if not clean:
        raise HTTPException(status_code=400, detail="Please type a message.")

    session_id = body.session_id or f"pub_{uuid.uuid4().hex[:12]}"
    message_id = f"msg_{uuid.uuid4().hex[:12]}"

    async def event_stream():
        yield _sse("meta", {"session_id": session_id, "message_id": message_id})

        try:
            reply = await _call_gemini(clean, body.language)
            # Send as a single chunk (Gemini doesn't support true streaming via REST easily)
            yield _sse("chunk", {"text": reply})
        except Exception as e:
            logger.error("public_stream_error", error=str(e))
            yield _sse("chunk", {"text": "I'm having trouble connecting right now. Please visit https://www.eduplexo.com/ for more information."})

        yield _sse("done", {"reason": "complete"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


async def _call_gemini(message: str, language: str) -> str:
    """Call Gemini API with the landing page system prompt."""
    import httpx

    lang_instruction = ""
    if language == "urdu":
        lang_instruction = "\n\nIMPORTANT: Respond in Roman Urdu (English script mein Urdu)."

    api_key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": LANDING_SYSTEM_PROMPT + lang_instruction}]},
            {"role": "model", "parts": [{"text": "Understood. I am the EduPlexo AI Assistant. I will help visitors learn about EduPlexo, guide them through features, and encourage demo bookings. Ready to assist."}]},
            {"role": "user", "parts": [{"text": message}]},
        ],
        "generationConfig": {
            "temperature": 0.5,
            "maxOutputTokens": 500,
            "topP": 0.9,
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return "I'm here to help you learn about EduPlexo. What would you like to know?"

    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return "I'm here to help you learn about EduPlexo. What would you like to know?"

    return parts[0].get("text", "")
