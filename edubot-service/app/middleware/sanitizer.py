"""Input sanitization middleware to block prompt injection attempts."""

import re

from fastapi import HTTPException, status

BLOCKED_PATTERNS = [
    r"ignore previous instructions",
    r"disregard your system prompt",
    r"you are now",
    r"jailbreak",
    r"act as (a different|an? (?!assistant))",
]

_compiled = [re.compile(p, re.IGNORECASE) for p in BLOCKED_PATTERNS]


def sanitize_message(message: str) -> str:
    """Validate and sanitize user input.

    Raises HTTPException 400 if prompt injection is detected.
    Truncates to 2000 characters.
    """
    for pattern in _compiled:
        if pattern.search(message):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This message cannot be processed.",
            )

    return message[:2000].strip()
