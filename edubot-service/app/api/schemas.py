"""Pydantic request/response models for the chat API."""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── Requests ─────────────────────────────────────────────────────────────


class ChatMessageRequest(BaseModel):
    """POST /chat/message and POST /chat/stream request body."""

    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str = Field(..., min_length=1, max_length=64)
    language: str = Field(default="english", pattern=r"^(english|urdu)$")


class ClearSessionRequest(BaseModel):
    """DELETE /chat/session request body."""

    session_id: str = Field(..., min_length=1, max_length=64)


class FeedbackRequest(BaseModel):
    """POST /chat/feedback request body."""

    message_id: str = Field(..., min_length=1)
    rating: str = Field(..., pattern=r"^(positive|negative)$")


# ─── Responses ────────────────────────────────────────────────────────────


class ActionButton(BaseModel):
    """A clickable action surfaced with an assistant reply."""

    label: str
    path: str
    intent: str = "navigate"


class ChatMessageResponse(BaseModel):
    """POST /chat/message response."""

    session_id: str
    message_id: str
    reply: str
    timestamp: datetime
    actions: list[ActionButton] = Field(default_factory=list)


class ClearSessionResponse(BaseModel):
    """DELETE /chat/session response."""

    status: str = "cleared"


class FeedbackResponse(BaseModel):
    """POST /chat/feedback response."""

    status: str = "ok"


class HealthResponse(BaseModel):
    """GET /chat/health response."""

    status: str
    gemini: str
    redis: str


class ErrorDetail(BaseModel):
    """Error response body."""

    code: str
    message: str


class ErrorResponse(BaseModel):
    """Wrapper for error responses."""

    error: ErrorDetail
