"""Chat endpoint handlers — OpenAI Agents SDK + Gemini, with SSE streaming."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.agents.edubot_agent import run_with_fallback, stream_with_fallback
from app.agents.request_context import CallerContext, reset_caller, set_caller
from app.api.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ClearSessionResponse,
    ClearSessionRequest,
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
)
from app.auth.dependencies import UserContext, get_current_user
from app.guardrails.input_filter import classify_input
from app.guardrails.output_filter import filter_reply
from app.guardrails.templates import (
    ERROR_GENERIC,
    REFUSAL_BULK_EXPORT,
    REFUSAL_OUT_OF_SCOPE,
    REFUSAL_WRITE_OPERATION,
)
from app.middleware.rate_limiter import check_rate_limit
from app.middleware.redis_client import check_redis_health
from app.middleware.sanitizer import sanitize_message
from app.routes.catalog import find_actions

logger = structlog.get_logger()

router = APIRouter(prefix="/chat", tags=["chat"])


# ─── Helpers ─────────────────────────────────────────────────────────────


def _bind_caller(user: UserContext, language: str):
    """Push the authenticated user into contextvar so tools can read it."""
    caller = CallerContext(
        user_id=user.user_id,
        school_id=user.school_id,
        role=user.role,
        name=user.name,
        raw_token=user.raw_token,
        academic_year_id=user.academic_year_id,
        language=language,
    )
    return set_caller(caller)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# ─── POST /chat/message (non-streaming) ──────────────────────────────────


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    body: ChatMessageRequest,
    user: UserContext = Depends(get_current_user),
):
    if not await check_rate_limit(user.user_id):
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a moment.")

    clean = sanitize_message(body.message)
    if not clean:
        raise HTTPException(status_code=400, detail="Please type a message.")

    verdict = classify_input(clean)
    if verdict != "ok":
        refusal = {
            "block_inject": REFUSAL_OUT_OF_SCOPE,
            "block_write": REFUSAL_WRITE_OPERATION,
            "block_bulk": REFUSAL_BULK_EXPORT,
            "block_offtopic": REFUSAL_OUT_OF_SCOPE,
        }.get(verdict, REFUSAL_OUT_OF_SCOPE)
        return _make_response(body.session_id, refusal, body.language, clean, user)

    agent_kwargs = {"role": user.role, "name": user.name, "language": body.language}
    token = _bind_caller(user, body.language)
    try:
        reply_text = await run_with_fallback(agent_kwargs, clean)
        if not reply_text:
            reply_text = ERROR_GENERIC
    except Exception as e:
        logger.error("agent_run_failed", error=str(e), user_id=user.user_id)
        reply_text = ERROR_GENERIC
    finally:
        reset_caller(token)

    return _make_response(body.session_id, reply_text, body.language, clean, user)


def _make_response(
    session_id: str,
    reply: str,
    language: str,
    user_message: str,
    user: UserContext,
) -> ChatMessageResponse:
    filtered, audit = filter_reply(reply)
    actions = find_actions(message=user_message, role=user.role, language=language, limit=3)

    logger.info(
        "chat_reply",
        user_id=user.user_id,
        role=user.role,
        session_id=session_id,
        actions=len(actions),
        redacted=audit["redacted"],
    )

    return ChatMessageResponse(
        session_id=session_id,
        message_id=f"msg_{uuid.uuid4().hex[:12]}",
        reply=filtered,
        timestamp=datetime.now(timezone.utc),
        actions=actions,
    )


# ─── POST /chat/stream (SSE, ChatGPT-style) ──────────────────────────────


@router.post("/stream")
async def stream_message(
    body: ChatMessageRequest,
    user: UserContext = Depends(get_current_user),
):
    """Stream the agent's reply token-by-token over SSE.

    Events: meta, chunk, replace, actions, done, error.
    """
    if not await check_rate_limit(user.user_id):
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a moment.")

    clean = sanitize_message(body.message)
    if not clean:
        raise HTTPException(status_code=400, detail="Please type a message.")

    verdict = classify_input(clean)
    refusal: str | None = None
    if verdict != "ok":
        refusal = {
            "block_inject": REFUSAL_OUT_OF_SCOPE,
            "block_write": REFUSAL_WRITE_OPERATION,
            "block_bulk": REFUSAL_BULK_EXPORT,
            "block_offtopic": REFUSAL_OUT_OF_SCOPE,
        }.get(verdict, REFUSAL_OUT_OF_SCOPE)

    message_id = f"msg_{uuid.uuid4().hex[:12]}"

    async def event_stream():
        yield _sse("meta", {"session_id": body.session_id, "message_id": message_id})

        full_reply = ""

        if refusal is not None:
            full_reply = refusal
            yield _sse("chunk", {"text": refusal})
        else:
            agent_kwargs = {"role": user.role, "name": user.name, "language": body.language}
            token = _bind_caller(user, body.language)
            try:
                async for text_chunk in stream_with_fallback(agent_kwargs, clean):
                    if text_chunk:
                        full_reply += text_chunk
                        yield _sse("chunk", {"text": text_chunk})
            except Exception as e:
                logger.error("stream_error", error=str(e), user_id=user.user_id)
                if not full_reply:
                    yield _sse("error", {"detail": ERROR_GENERIC, "code": "AI_ERROR"})
                    return
            finally:
                reset_caller(token)

        # Output guardrails
        filtered, audit = filter_reply(full_reply)
        if filtered != full_reply:
            yield _sse("replace", {"text": filtered})

        actions = find_actions(
            message=clean,
            role=user.role,
            language=body.language,
            limit=3,
        )
        if actions:
            yield _sse("actions", {"actions": actions})

        logger.info(
            "stream_complete",
            user_id=user.user_id,
            role=user.role,
            session_id=body.session_id,
            length=len(filtered),
            actions=len(actions),
        )

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


# ─── Session / feedback / health ─────────────────────────────────────────


@router.delete("/session", response_model=ClearSessionResponse)
async def clear_session_endpoint(
    body: ClearSessionRequest,
    user: UserContext = Depends(get_current_user),
):
    # OpenAI Agents SDK manages sessions in-memory; clearing is a no-op
    # on the server side. The frontend clears localStorage.
    logger.info("session_cleared", user_id=user.user_id, session_id=body.session_id)
    return ClearSessionResponse(status="cleared")


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    body: FeedbackRequest,
    user: UserContext = Depends(get_current_user),
):
    logger.info("chat_feedback", user_id=user.user_id, message_id=body.message_id, rating=body.rating)
    return FeedbackResponse(status="ok")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    redis_ok = await check_redis_health()
    gemini_ok = bool(settings_key())
    return HealthResponse(
        status="ok" if (redis_ok and gemini_ok) else "degraded",
        gemini="connected" if gemini_ok else "unavailable",
        redis="connected" if redis_ok else "unavailable",
    )


def settings_key() -> str:
    from app.core.config import settings
    return settings.GEMINI_API_KEY
