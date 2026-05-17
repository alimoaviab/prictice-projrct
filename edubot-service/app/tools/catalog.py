"""ADK tool catalog for EduBot.

Each tool is a plain async Python function with type hints + docstring.
ADK reads the signature to build the function schema automatically.

ABSOLUTE RULES:
- Read-only: no POST / PUT / DELETE tools.
- The user's JWT (read from request_context) is forwarded to the Go backend,
  so RBAC + tenant scoping are enforced by the Go backend on every tool call.
- A second defence-in-depth role check happens here before each call.
"""

from __future__ import annotations

import json

import httpx
import structlog

from app.agents.request_context import get_caller
from app.core.config import settings

logger = structlog.get_logger()


_ALL_ROLES = frozenset({"super_admin", "admin", "teacher", "parent", "student"})
_ADMIN_ONLY = frozenset({"super_admin", "admin"})

# Per-tool whitelist of query-string params. Anything else is dropped before
# calling the Go backend.
_PARAM_WHITELIST: dict[str, set[str]] = {
    "list_students": {"class_id", "limit"},
    "list_teachers": {"limit"},
    "get_attendance": {"date", "class_id", "student_id"},
}


# ─── HTTP helper (forwards user JWT to Go backend) ───────────────────────


def _allowed(role: str, allowed: frozenset[str]) -> bool:
    return role in allowed


async def _go_get(
    path: str,
    allowed_roles: frozenset[str],
    params: dict | None = None,
    tool_name: str = "",
) -> dict:
    """GET against the Go backend with the caller's JWT.

    Returns either the parsed JSON response or a structured error dict the
    LLM can read and turn into a polite refusal.
    """
    caller = get_caller()

    if not _allowed(caller.role, allowed_roles):
        return {
            "ok": False,
            "code": "TOOL_DENIED",
            "message": "Your role is not allowed to use this capability.",
        }

    # Strip params not in whitelist for this tool.
    safe_params: dict[str, str] = {}
    if params:
        whitelist = _PARAM_WHITELIST.get(tool_name, set())
        for k, v in params.items():
            if k not in whitelist:
                logger.warning("tool_param_rejected", tool=tool_name, param=k)
                continue
            if v in (None, ""):
                continue
            safe_params[k] = str(v)[:128]

    url = f"{settings.GO_BACKEND_URL.rstrip('/')}{path}"
    headers = {
        "Authorization": f"Bearer {caller.raw_token}",
        "Accept": "application/json",
    }
    if caller.academic_year_id:
        headers["x-academic-year-id"] = caller.academic_year_id

    logger.info("tool_call", tool=tool_name, role=caller.role, path=path, params=safe_params)

    try:
        async with httpx.AsyncClient(timeout=settings.GO_BACKEND_TIMEOUT) as client:
            resp = await client.get(url, params=safe_params, headers=headers)
    except httpx.TimeoutException:
        return {"ok": False, "code": "BACKEND_TIMEOUT", "message": "Backend took too long."}
    except httpx.RequestError:
        return {"ok": False, "code": "BACKEND_UNREACHABLE", "message": "Backend is unreachable."}

    if resp.status_code == 401:
        return {"ok": False, "code": "UNAUTHORIZED", "message": "Session expired."}
    if resp.status_code == 403:
        return {"ok": False, "code": "FORBIDDEN", "message": "You do not have permission."}
    if resp.status_code >= 400:
        logger.warning(
            "tool_backend_error",
            tool=tool_name,
            status=resp.status_code,
            body=resp.text[:200],
        )
        return {"ok": False, "code": "BACKEND_ERROR", "message": "Backend returned an error."}

    try:
        body = resp.json()
    except json.JSONDecodeError:
        return {"ok": False, "code": "BAD_RESPONSE", "message": "Backend returned invalid JSON."}

    return {"ok": True, "data": _shrink(body)}


# ─── Output trimming ─────────────────────────────────────────────────────

_SENSITIVE_FIELDS = {
    "email", "phone", "cnic", "password_hash", "password",
    "address", "national_id", "guardian_phone", "guardian_email",
}


def _shrink(obj, max_items: int = 50):
    """Trim large list payloads + strip sensitive fields before feeding the LLM.

    IMPORTANT: We preserve the total count so the LLM can report accurate
    numbers even when the list is truncated for prompt-size reasons.
    """

    def clean(o):
        if isinstance(o, dict):
            return {k: clean(v) for k, v in o.items() if k.lower() not in _SENSITIVE_FIELDS}
        if isinstance(o, list):
            total = len(o)
            trimmed = [clean(x) for x in o[:max_items]]
            # If we truncated, append a summary marker so the LLM knows the real count
            if total > max_items:
                trimmed.append({"_truncated": True, "_total_count": total, "_shown": max_items})
            return trimmed
        return o

    if isinstance(obj, dict):
        # Common envelope: { ok, data: [...] } — add total_count at top level
        if "data" in obj and isinstance(obj["data"], list):
            total = len(obj["data"])
            cleaned_data = clean(obj["data"])
            result = {k: v for k, v in obj.items() if k != "data"}
            result["data"] = cleaned_data
            result["total_count"] = total
            return result
        return clean(obj)
    return clean(obj)


# ─── Tools (each is exposed to the LLM) ──────────────────────────────────


async def get_dashboard_stats() -> dict:
    """Get a high-level dashboard summary for the user's school: student count,
    teacher count, attendance percentage today, upcoming events, and similar.

    Use this when the user asks for a general overview, summary, or
    'how is my school doing today' kind of questions.
    """
    return await _go_get(
        path="/api/analytics/dashboard",
        allowed_roles=_ALL_ROLES,
        tool_name="get_dashboard_stats",
    )


async def list_students(class_id: str = "", limit: str = "") -> dict:
    """List students the user is allowed to see.

    Admin and teacher see the school's students; parent sees their children;
    student sees only themselves. Use for questions like 'how many students',
    'show student list', 'who is in class X'.

    IMPORTANT: The response includes a 'total_count' field with the REAL total
    number of students. Always use total_count for counting questions, not the
    length of the 'data' array (which may be truncated for display).

    Args:
        class_id: Optional class identifier to filter by.
        limit: Optional max number of records to return (default 20, max 100).
    """
    return await _go_get(
        path="/api/students",
        allowed_roles=_ALL_ROLES,
        params={"class_id": class_id, "limit": limit},
        tool_name="list_students",
    )


async def list_teachers(limit: str = "") -> dict:
    """List teachers in the user's school.

    Args:
        limit: Optional max number of records (default 20).
    """
    return await _go_get(
        path="/api/teachers",
        allowed_roles=_ALL_ROLES,
        params={"limit": limit},
        tool_name="list_teachers",
    )


async def list_classes() -> dict:
    """List classes/sections in the user's school."""
    return await _go_get(
        path="/api/classes",
        allowed_roles=_ALL_ROLES,
        tool_name="list_classes",
    )


async def list_subjects() -> dict:
    """List subjects taught at the user's school."""
    return await _go_get(
        path="/api/subjects",
        allowed_roles=_ALL_ROLES,
        tool_name="list_subjects",
    )


async def get_attendance(date: str = "", class_id: str = "", student_id: str = "") -> dict:
    """Get attendance records the user is allowed to see.

    Admin/teacher see school-wide or by class. Parent sees their children.
    Student sees their own.

    Args:
        date: Optional date (YYYY-MM-DD) to filter by.
        class_id: Optional class ID.
        student_id: Optional student ID.
    """
    return await _go_get(
        path="/api/attendance",
        allowed_roles=_ALL_ROLES,
        params={"date": date, "class_id": class_id, "student_id": student_id},
        tool_name="get_attendance",
    )


async def list_exams() -> dict:
    """List exams or tests scheduled for the user's school or class."""
    return await _go_get(
        path="/api/exams",
        allowed_roles=_ALL_ROLES,
        tool_name="list_exams",
    )


async def list_results() -> dict:
    """List exam results the user is allowed to see.

    Admin/teacher see school-wide. Parent sees their children. Student sees
    only their own.
    """
    return await _go_get(
        path="/api/results",
        allowed_roles=_ALL_ROLES,
        tool_name="list_results",
    )


async def list_homework() -> dict:
    """List homework assignments for the user's class or school."""
    return await _go_get(
        path="/api/homework",
        allowed_roles=_ALL_ROLES,
        tool_name="list_homework",
    )


async def list_events() -> dict:
    """List upcoming school events."""
    return await _go_get(
        path="/api/events",
        allowed_roles=_ALL_ROLES,
        tool_name="list_events",
    )


async def list_announcements() -> dict:
    """List announcements visible to the user."""
    return await _go_get(
        path="/api/announcements",
        allowed_roles=_ALL_ROLES,
        tool_name="list_announcements",
    )


async def list_behavior() -> dict:
    """List behavior records the user is allowed to see."""
    return await _go_get(
        path="/api/behavior",
        allowed_roles=_ALL_ROLES,
        tool_name="list_behavior",
    )


async def list_fees() -> dict:
    """List fee records.

    Admin sees school-wide. Parent and student see their own dues only.
    Teachers cannot see fee details.
    """
    return await _go_get(
        path="/api/fees",
        # Teachers explicitly excluded — fee data is sensitive.
        allowed_roles=frozenset({"super_admin", "admin", "parent", "student"}),
        tool_name="list_fees",
    )


async def get_timetable() -> dict:
    """Get the timetable for the user's class or school."""
    return await _go_get(
        path="/api/timetable",
        allowed_roles=_ALL_ROLES,
        tool_name="get_timetable",
    )


# Bundle for the agent module.
ALL_TOOLS = [
    get_dashboard_stats,
    list_students,
    list_teachers,
    list_classes,
    list_subjects,
    get_attendance,
    list_exams,
    list_results,
    list_homework,
    list_events,
    list_announcements,
    list_behavior,
    list_fees,
    get_timetable,
]
