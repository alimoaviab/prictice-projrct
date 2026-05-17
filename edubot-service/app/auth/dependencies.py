"""JWT authentication dependency for FastAPI."""

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

bearer_scheme = HTTPBearer()


@dataclass
class UserContext:
    """Authenticated user context extracted from JWT."""

    user_id: str
    school_id: str
    role: str
    name: str
    session_id: str
    raw_token: str  # forwarded to the Go backend for tool calls
    academic_year_id: str = ""


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserContext:
    """Decode and validate the JWT token from the Authorization header.

    The token structure matches the Go backend's Claims:
    - sub: user_id
    - school_id: tenant identifier
    - role: user role
    - session_id: session identifier
    - app: must be "school"
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
        )

    # Validate required claims
    user_id = payload.get("sub")
    school_id = payload.get("school_id")
    role = payload.get("role")
    session_id = payload.get("session_id", "")

    if not user_id or not school_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims.",
        )

    # Validate app claim matches expected value
    app_claim = payload.get("app", "")
    if app_claim and app_claim != "school":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid application session.",
        )

    return UserContext(
        user_id=user_id,
        school_id=school_id,
        role=role,
        name=payload.get("name", "User"),
        session_id=session_id,
        raw_token=token,
        academic_year_id=payload.get("active_academic_year_id", ""),
    )
