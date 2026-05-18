"""Plexa agent — OpenAI Agents SDK backed by Gemini (primary) + OpenRouter (fallback).

Architecture:
  - Primary: Gemini 2.5 Flash via Google's OpenAI-compatible endpoint
  - Fallback: OpenRouter (same model or any other) if Gemini fails
  - OpenAI Agents SDK provides: Agent, Runner, function_tool, streaming
"""

from __future__ import annotations

import asyncio

import structlog
from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool, ModelSettings
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel

from app.agents.instructions import build_instruction
from app.core.config import settings
from app.tools.catalog import (
    get_attendance,
    get_dashboard_stats,
    get_timetable,
    list_announcements,
    list_behavior,
    list_classes,
    list_events,
    list_exams,
    list_fees,
    list_homework,
    list_results,
    list_students,
    list_subjects,
    list_teachers,
)

logger = structlog.get_logger()


# ─── Primary: Groq or Gemini ───────────────────────────────────────────────

if settings.GROQ_API_KEY:
    _groq_client = AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    _primary_model = OpenAIChatCompletionsModel(
        model=settings.GROQ_MODEL,
        openai_client=_groq_client,
    )
else:
    _gemini_client = AsyncOpenAI(
        api_key=settings.GEMINI_API_KEY or "dummy",
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    _primary_model = OpenAIChatCompletionsModel(
        model=settings.GEMINI_MODEL,
        openai_client=_gemini_client,
    )


# ─── Fallback: OpenRouter ─────────────────────────────────────────────────

_fallback_model = None
if settings.OPENROUTER_API_KEY:
    _openrouter_client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )
    _fallback_model = OpenAIChatCompletionsModel(
        model=settings.OPENROUTER_MODEL,
        openai_client=_openrouter_client,
    )


# ─── Tools ────────────────────────────────────────────────────────────────

_tools = [
    function_tool(get_dashboard_stats),
    function_tool(list_students),
    function_tool(list_teachers),
    function_tool(list_classes),
    function_tool(list_subjects),
    function_tool(get_attendance),
    function_tool(list_exams),
    function_tool(list_results),
    function_tool(list_homework),
    function_tool(list_events),
    function_tool(list_announcements),
    function_tool(list_behavior),
    function_tool(list_fees),
    function_tool(get_timetable),
]


# ─── Agent factory ────────────────────────────────────────────────────────


def create_agent(role: str, name: str, language: str, use_fallback: bool = False) -> Agent:
    """Create a per-turn agent with the correct instruction and model.

    Args:
        role: User's role (admin, teacher, parent, student).
        name: User's display name.
        language: Response language (english, urdu).
        use_fallback: If True, use OpenRouter instead of Gemini.
    """
    model = _fallback_model if (use_fallback and _fallback_model) else _primary_model

    return Agent(
        name="Plexa",
        model=model,
        instructions=build_instruction(role=role, name=name, language=language),
        tools=_tools,
        model_settings=ModelSettings(
            temperature=0.5,
            top_p=0.95,
            max_tokens=4096,
        ),
    )


async def run_with_fallback(agent_kwargs: dict, user_input: str) -> str:
    """Run the agent with automatic fallback to OpenRouter on failure.

    Returns the final output text.
    """
    # Try primary (Gemini) with one retry for rate limits
    for attempt in range(2):
        try:
            agent = create_agent(**agent_kwargs, use_fallback=False)
            result = await Runner.run(agent, user_input)
            if result.final_output:
                return result.final_output
            break  # Got a result (even if empty), don't retry
        except Exception as e:
            error_str = str(e).lower()
            logger.warning("primary_model_failed", error=str(e), attempt=attempt)
            is_rate_limit = "429" in str(e) or "quota" in error_str or "resource_exhausted" in error_str
            # Retry once after a short delay for rate limits
            if is_rate_limit and attempt == 0:
                await asyncio.sleep(2)
                continue
            # If quota exhausted and no fallback, surface a clear message
            if is_rate_limit and not _fallback_model:
                return (
                    "The AI service is temporarily at capacity. "
                    "Please try again in a few moments."
                )
            break

    # Fallback to OpenRouter
    if _fallback_model:
        try:
            agent = create_agent(**agent_kwargs, use_fallback=True)
            result = await Runner.run(agent, user_input)
            if result.final_output:
                logger.info("fallback_model_used")
                return result.final_output
        except Exception as e:
            logger.error("fallback_model_failed", error=str(e))

    return ""


async def stream_with_fallback(agent_kwargs: dict, user_input: str):
    """Stream the agent with automatic fallback. Yields text chunks.

    If primary fails, retries with fallback model.
    """
    import os
    from openai import AsyncOpenAI
    
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    if not api_key:
        yield "Gemini API key is missing in .env"
        return
        
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": user_input}],
            stream=False
        )
        content = response.choices[0].message.content
        if content:
            yield content
        else:
            yield "Received empty response from Gemini."
    except Exception as e:
        error_str = str(e).lower()
        logger.warning("primary_stream_failed", error=str(e))
        # If quota exhausted and no fallback, yield a clear error message
        if ("429" in str(e) or "quota" in error_str or "resource_exhausted" in error_str) and not _fallback_model:
            yield (
                "The AI service is temporarily at capacity. "
                "Please try again in a few moments."
            )
            return

    # Fallback
    if _fallback_model:
        try:
            agent = create_agent(**agent_kwargs, use_fallback=True)
            result = Runner.run_streamed(agent, user_input)
            got_text = False
            async for event in result.stream_events():
                text = _extract_text(event)
                if text:
                    got_text = True
                    yield text
            if not got_text and result.final_output:
                yield result.final_output
            logger.info("fallback_stream_used")
        except Exception as e:
            logger.error("fallback_stream_failed", error=str(e))
            yield (
                "The AI service is currently unavailable. "
                "Please try again in a few moments."
            )


def _extract_text(event) -> str:
    """Extract text delta from a stream event."""
    # pyrefly: ignore [missing-import]
    from agents.stream_events import RawResponsesStreamEvent

    # Try standard RawResponsesStreamEvent
    if isinstance(event, RawResponsesStreamEvent):
        data = event.data
        if hasattr(data, "choices"):
            for choice in data.choices:
                delta = getattr(choice, "delta", None)
                if delta:
                    text = getattr(delta, "content", None)
                    if text:
                        return text

    # Fallback: check if event has data and choices directly
    data = getattr(event, "data", None)
    if data:
        choices = getattr(data, "choices", None)
        if choices:
            for choice in choices:
                delta = getattr(choice, "delta", None)
                if delta:
                    text = getattr(delta, "content", None)
                    if text:
                        return text

    # Fallback: check if event itself has choices (raw OpenAI chunk)
    choices = getattr(event, "choices", None)
    if choices:
        for choice in choices:
            delta = getattr(choice, "delta", None)
            if delta:
                text = getattr(delta, "content", None)
                if text:
                    return text

    # Fallback: check if event has 'content' or 'text' attribute
    content = getattr(event, "content", None)
    if content:
        return content
    text = getattr(event, "text", None)
    if text:
        return text

    return ""
