"""Per-request user context, propagated to ADK tools via contextvars.

ADK tools are plain Python functions — they don't get the FastAPI request.
We push the authenticated user into a ContextVar at the start of each chat
turn so any tool that needs it (for JWT forwarding to the Go backend) can
read it.
"""

from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass


@dataclass(frozen=True)
class CallerContext:
    """The signed-in user issuing the current chat turn."""

    user_id: str
    school_id: str
    role: str
    name: str
    raw_token: str
    academic_year_id: str = ""
    language: str = "english"


_caller_var: ContextVar[CallerContext | None] = ContextVar("plexa_caller", default=None)


def set_caller(caller: CallerContext) -> object:
    """Bind a caller for the current async task. Returns a token to reset."""
    return _caller_var.set(caller)


def reset_caller(token: object) -> None:
    """Undo a previous set_caller call."""
    _caller_var.reset(token)  # type: ignore[arg-type]


def get_caller() -> CallerContext:
    """Read the current caller. Raises if no caller is bound."""
    caller = _caller_var.get()
    if caller is None:
        raise RuntimeError("No caller bound — set_caller must be called first")
    return caller
