"""Frontend route catalog — what each role can navigate to.

This catalog is the source of truth for action buttons Plexa can suggest.
It mirrors the React Router routes in school-react-app/src/routes/.

WHY THIS EXISTS HERE: the LLM may hallucinate routes. We constrain it to
the whitelist below, then validate role access before sending to the user.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RouteAction:
    """A clickable action the chatbot may surface to the user."""

    label: str
    """Human-readable button text (English)."""

    label_urdu: str
    """Urdu translation for the button text."""

    path: str
    """Frontend route path the button navigates to."""

    intent: str
    """Action intent: 'navigate' | 'create' | 'view' — drives icon."""

    keywords: list[str]
    """Phrases that should surface this action."""

    allowed_roles: frozenset[str]


# ─── The catalog ──────────────────────────────────────────────────────────
# Order matters when keywords overlap — first match wins in get_actions_for.

_ALL = frozenset({"super_admin", "admin", "teacher", "parent", "student"})
_ADMIN = frozenset({"super_admin", "admin"})
_STAFF = frozenset({"super_admin", "admin", "teacher"})


CATALOG: list[RouteAction] = [
    # ─── Classes ──────────────────────────────────────────────────────────
    RouteAction(
        label="Create Class",
        label_urdu="Nayi Class Banayein",
        path="/admin/classes/create",
        intent="create",
        keywords=["create class", "create a class", "add class", "add a class", "new class", "make class", "make a class", "نئی کلاس", "کلاس بنا"],
        allowed_roles=_ADMIN,
    ),
    RouteAction(
        label="View Classes",
        label_urdu="Classes Dekhein",
        path="/admin/classes",
        intent="navigate",
        keywords=["class", "classes", "section", "کلاس"],
        allowed_roles=_ADMIN,
    ),

    # ─── Students ─────────────────────────────────────────────────────────
    RouteAction(
        label="Add Student",
        label_urdu="Student Add Karein",
        path="/admin/students",
        intent="create",
        keywords=["add student", "add a student", "new student", "create student", "create a student", "register student", "طالب علم شامل", "نیا طالب"],
        allowed_roles=_ADMIN,
    ),
    RouteAction(
        label="View Students",
        label_urdu="Students Dekhein",
        path="/admin/students",
        intent="navigate",
        keywords=["student", "students", "طلبہ", "طالب علم"],
        allowed_roles=_ADMIN,
    ),

    # ─── Teachers ─────────────────────────────────────────────────────────
    RouteAction(
        label="Add Teacher",
        label_urdu="Teacher Add Karein",
        path="/admin/teachers",
        intent="create",
        keywords=["add teacher", "add a teacher", "new teacher", "create teacher", "create a teacher", "hire teacher", "استاد شامل", "نیا استاد"],
        allowed_roles=_ADMIN,
    ),
    RouteAction(
        label="View Teachers",
        label_urdu="Teachers Dekhein",
        path="/admin/teachers",
        intent="navigate",
        keywords=["teacher", "teachers", "faculty", "اساتذہ", "استاد"],
        allowed_roles=_ADMIN,
    ),

    # ─── Subjects ─────────────────────────────────────────────────────────
    RouteAction(
        label="Manage Subjects",
        label_urdu="Subjects Dekhein",
        path="/admin/subjects",
        intent="navigate",
        keywords=["subject", "subjects", "مضمون", "مضامین"],
        allowed_roles=_ADMIN,
    ),

    # ─── Attendance ───────────────────────────────────────────────────────
    RouteAction(
        label="Mark Attendance",
        label_urdu="Attendance Lagayein",
        path="/admin/attendance/create",
        intent="create",
        keywords=["mark attendance", "take attendance", "حاضری لگ", "حاضری لیں"],
        allowed_roles=_STAFF,
    ),
    RouteAction(
        label="View Attendance",
        label_urdu="Attendance Dekhein",
        path="/admin/attendance",
        intent="navigate",
        keywords=["attendance", "حاضری"],
        allowed_roles=_ALL,
    ),

    # ─── Exams / Tests ────────────────────────────────────────────────────
    RouteAction(
        label="Create Exam",
        label_urdu="Exam Banayein",
        path="/admin/exams",
        intent="create",
        keywords=["create exam", "new exam", "schedule exam", "امتحان بنا", "نیا امتحان"],
        allowed_roles=_STAFF,
    ),
    RouteAction(
        label="View Exams",
        label_urdu="Exams Dekhein",
        path="/admin/exams",
        intent="navigate",
        keywords=["exam", "exams", "test", "امتحان"],
        allowed_roles=_ALL,
    ),
    RouteAction(
        label="Enter Marks",
        label_urdu="Marks Enter Karein",
        path="/admin/exams/marks",
        intent="create",
        keywords=["enter marks", "add marks", "grade", "نمبر درج", "نمبر لگ"],
        allowed_roles=_STAFF,
    ),

    # ─── Results ──────────────────────────────────────────────────────────
    RouteAction(
        label="View Results",
        label_urdu="Results Dekhein",
        path="/admin/results",
        intent="navigate",
        keywords=["result", "results", "marks", "نتیجہ", "نتائج"],
        allowed_roles=_ALL,
    ),

    # ─── Homework ─────────────────────────────────────────────────────────
    RouteAction(
        label="Create Homework",
        label_urdu="Homework Banayein",
        path="/admin/homework",
        intent="create",
        keywords=["create homework", "assign homework", "new homework", "ہوم ورک بنا", "ہوم ورک دیں"],
        allowed_roles=_STAFF,
    ),
    RouteAction(
        label="View Homework",
        label_urdu="Homework Dekhein",
        path="/admin/homework",
        intent="navigate",
        keywords=["homework", "assignment", "ہوم ورک"],
        allowed_roles=_ALL,
    ),

    # ─── Fees ─────────────────────────────────────────────────────────────
    RouteAction(
        label="Open Fees",
        label_urdu="Fees Kholein",
        path="/admin/fee",
        intent="navigate",
        keywords=["fee", "fees", "payment", "voucher", "فیس"],
        allowed_roles=frozenset({"super_admin", "admin", "parent", "student"}),
    ),

    # ─── Timetable ────────────────────────────────────────────────────────
    RouteAction(
        label="Open Timetable",
        label_urdu="Timetable Kholein",
        path="/admin/timetable",
        intent="navigate",
        keywords=["timetable", "schedule", "ٹائم ٹیبل"],
        allowed_roles=_ALL,
    ),

    # ─── Announcements ────────────────────────────────────────────────────
    RouteAction(
        label="Create Announcement",
        label_urdu="Announcement Banayein",
        path="/admin/announcements/create",
        intent="create",
        keywords=["create announcement", "new announcement", "post announcement", "اعلان بنا", "نیا اعلان"],
        allowed_roles=_ADMIN,
    ),
    RouteAction(
        label="View Announcements",
        label_urdu="Announcements Dekhein",
        path="/admin/announcements",
        intent="navigate",
        keywords=["announcement", "announcements", "اعلان"],
        allowed_roles=_ALL,
    ),

    # ─── Events ───────────────────────────────────────────────────────────
    RouteAction(
        label="Create Event",
        label_urdu="Event Banayein",
        path="/admin/events/create",
        intent="create",
        keywords=["create event", "schedule event", "new event", "ایونٹ بنا"],
        allowed_roles=_ADMIN,
    ),
    RouteAction(
        label="View Events",
        label_urdu="Events Dekhein",
        path="/admin/events",
        intent="navigate",
        keywords=["event", "events", "ایونٹ"],
        allowed_roles=_ALL,
    ),

    # ─── Behavior ─────────────────────────────────────────────────────────
    RouteAction(
        label="View Behavior",
        label_urdu="Behavior Dekhein",
        path="/admin/behavior",
        intent="navigate",
        keywords=["behavior", "behaviour", "سلوک"],
        allowed_roles=_ALL,
    ),

    # ─── Leave ────────────────────────────────────────────────────────────
    RouteAction(
        label="Open Leave",
        label_urdu="Leave Kholein",
        path="/admin/leave",
        intent="navigate",
        keywords=["leave", "absence", "چھٹی"],
        allowed_roles=_ALL,
    ),

    # ─── Live class / exam ────────────────────────────────────────────────
    RouteAction(
        label="Open Live Classes",
        label_urdu="Live Classes",
        path="/admin/live-classes",
        intent="navigate",
        keywords=["live class", "online class", "video class", "لائیو کلاس"],
        allowed_roles=_ALL,
    ),

    # ─── Dashboard ────────────────────────────────────────────────────────
    RouteAction(
        label="Open Dashboard",
        label_urdu="Dashboard",
        path="/admin/dashboard",
        intent="navigate",
        keywords=["dashboard", "overview", "summary", "ڈیش بورڈ"],
        allowed_roles=_ALL,
    ),

    # ─── Settings ─────────────────────────────────────────────────────────
    RouteAction(
        label="Open Settings",
        label_urdu="Settings",
        path="/admin/settings",
        intent="navigate",
        keywords=["setting", "settings", "ترتیبات"],
        allowed_roles=_ADMIN,
    ),
]


# ─── Role-specific path remapping ────────────────────────────────────────
# /admin/X → /teacher/X for teachers, /parent/X for parents, /student/X for students.
# The frontend has parallel pages for each role.

_ROLE_PREFIX = {
    "super_admin": "/admin",
    "admin": "/admin",
    "teacher": "/teacher",
    "parent": "/parent",
    "student": "/student",
}


def _adjust_path(path: str, role: str) -> str:
    prefix = _ROLE_PREFIX.get(role, "/admin")
    if path.startswith("/admin/") and prefix != "/admin":
        return prefix + path[len("/admin"):]
    return path


def find_actions(message: str, role: str, language: str = "english", limit: int = 3) -> list[dict]:
    """Return up to `limit` action-button candidates for the user message.

    Matches keywords (case-insensitive). Filters by role. Returns serializable
    dicts ready to send to the frontend.
    """
    if not message:
        return []
    msg_low = message.lower()
    seen_paths: set[str] = set()
    results: list[dict] = []

    for action in CATALOG:
        if role not in action.allowed_roles:
            continue
        if not any(kw in msg_low for kw in action.keywords):
            continue
        adjusted = _adjust_path(action.path, role)
        if adjusted in seen_paths:
            continue
        seen_paths.add(adjusted)
        results.append({
            "label": action.label_urdu if language == "urdu" else action.label,
            "path": adjusted,
            "intent": action.intent,
        })
        if len(results) >= limit:
            break

    return results


def is_path_allowed(path: str, role: str) -> bool:
    """Strict check: validate a path returned by the LLM against the catalog."""
    if not path:
        return False
    for action in CATALOG:
        if role not in action.allowed_roles:
            continue
        if _adjust_path(action.path, role) == path or action.path == path:
            return True
    return False
