"""Shared async Redis connection — used by rate limiter and health checks."""

from __future__ import annotations

import redis.asyncio as redis

from app.core.config import settings

_pool: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _pool


async def close_redis() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def check_redis_health() -> bool:
    try:
        r = await get_redis()
        await r.ping()
        return True
    except Exception:
        return False
