"""Input guardrails — detect intent that should never be honored.

Returns one of:
  - "ok"           → proceed normally
  - "block_inject" → prompt injection / jailbreak attempt
  - "block_write"  → user asked the bot to perform a write operation
  - "block_bulk"   → user asked for a bulk export / dump
  - "block_other_user" → user asked about another specific person's data
"""

import re

# Prompt-injection / jailbreak phrases
_INJECTION = [
    re.compile(r"ignore (previous|all|prior) (instructions|rules|prompts)", re.IGNORECASE),
    re.compile(r"disregard (your|the) (system|prior) (prompt|instructions)", re.IGNORECASE),
    re.compile(r"you are now (a|an)", re.IGNORECASE),
    re.compile(r"act as (a|an) (different|new) ", re.IGNORECASE),
    re.compile(r"reveal (your|the) (system )?prompt", re.IGNORECASE),
    re.compile(r"\bjailbreak\b", re.IGNORECASE),
    re.compile(r"developer mode", re.IGNORECASE),
]

# Write intent — bot is read-only, all of these should be refused.
# IMPORTANT: "How do I create X?" is a how-to question, NOT a write command.
# We only block imperative commands like "create a student for me" or
# "delete all students". Questions starting with how/what/where/can/is are
# excluded via a negative lookbehind.
_HOW_TO_PREFIX = r"(?<!\bhow\s)(?<!\bhow\s+do\s+i\s)(?<!\bhow\s+to\s)(?<!\bcan\s+i\s)(?<!\bwhat\s+is\s)"

_WRITE_INTENT = [
    re.compile(r"\b(delete|remove|drop)\s+(all|the|every)", re.IGNORECASE),
    re.compile(r"\b(create|add|insert)\s+(a\s+)?(new\s+)?(student|teacher|class|exam|user|admin)\s+(for me|now|please|immediately|right now)", re.IGNORECASE),
    re.compile(r"\b(update|change|modify|edit)\s+(the|a)\s+(student|teacher|grade|mark|fee)\s+(for me|now|please|record)", re.IGNORECASE),
    re.compile(r"\bsend\s+(an?\s+)?(email|sms|notification|message)\s+to", re.IGNORECASE),
    re.compile(r"\bmark\s+(all|everyone|all\s+students?)\s+(present|absent)", re.IGNORECASE),
]

# Bulk-export intent
_BULK_INTENT = [
    re.compile(r"\b(export|download|dump)\s+(all|every|the\s+entire)", re.IGNORECASE),
    re.compile(r"\bgive me (the\s+)?(complete|full|entire)\s+(list|database|data)", re.IGNORECASE),
    re.compile(r"\b(list|show|give me)\s+(every|all)\s+(students?|teachers?|users?|emails?|phone)", re.IGNORECASE),
    re.compile(r"\b(every|all)\s+(student|teacher|user|parent)\s+(email|phone|cnic|address|contact)", re.IGNORECASE),
]


def classify_input(message: str) -> str:
    """Return a verdict label for the message."""
    if not message or not message.strip():
        return "ok"

    for p in _INJECTION:
        if p.search(message):
            return "block_inject"

    for p in _WRITE_INTENT:
        if p.search(message):
            return "block_write"

    for p in _BULK_INTENT:
        if p.search(message):
            return "block_bulk"

    return "ok"
