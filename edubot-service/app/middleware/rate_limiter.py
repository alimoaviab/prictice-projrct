"""Per-user rate limiting using Redis sliding window."""

import time

import structlog

from app.core.config import settings
from app.middleware.redis_client import get_redis

logger = structlog.get_logger()


async def check_rate_limit(user_id: str) -> bool:
    """Check if the user has exceeded their rate limit.

    Uses a Redis sorted set with timestamps as scores for a sliding window.

    Returns:
        True if the request is allowed, False if rate limited.
    """
    r = await get_redis()
    key = f"plexa:ratelimit:{user_id}"
    now = time.time()
    window_start = now - 60  # 1-minute window

    pipe = r.pipeline()
    # Remove entries older than the window
    pipe.zremrangebyscore(key, 0, window_start)
    # Count current entries in window
    pipe.zcard(key)
    # Add current request
    pipe.zadd(key, {str(now): now})
    # Set expiry on the key
    pipe.expire(key, 120)

    results = await pipe.execute()
    current_count = results[1]

    if current_count >= settings.RATE_LIMIT_PER_MINUTE:
        logger.warning("rate_limit_exceeded", user_id=user_id, count=current_count)
        return False

    return True
