"""Input guardrails — detect intent that should never be honored.

Returns one of:
  - "ok"             → proceed normally
  - "block_inject"   → prompt injection / jailbreak attempt
  - "block_write"    → user asked the bot to perform a write operation
  - "block_bulk"     → user asked for a bulk export / dump
  - "block_offtopic" → user asked something outside Eduplexo scope
                       (programming, general knowledge, etc.)
"""

import re

# Prompt-injection / jailbreak phrases
_INJECTION = [
    re.compile(r"ignore\s+(?:(?:all|every|previous|prior|the|your)\s+){1,3}(instructions|rules|prompts)", re.IGNORECASE),
    re.compile(r"disregard\s+(?:(?:all|every|previous|prior|the|your)\s+){1,3}(instructions|rules|prompts|system\s+prompt)", re.IGNORECASE),
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

# Off-topic intent — programming, general knowledge, other-software help.
# These match strong, unambiguous signals. We deliberately accept some
# false negatives (the system prompt is the last line of defense) to
# avoid false positives on legitimate Eduplexo questions.
_PROG_LANGS = (
    r"python|javascript|js|typescript|ts|java|c\+\+|c#|csharp|go(?:lang)?|"
    r"rust|ruby|php|sql|html|css|bash|shell|kotlin|swift|scala|perl"
)
_OFFTOPIC_INTENT = [
    # Programming requests — "write a python function" / "give me js code"
    re.compile(rf"\b(write|give|show|generate|create|build)\s+(me\s+)?(a\s+|an\s+|some\s+)?({_PROG_LANGS})\s+(code|script|program|function|snippet|example|app|api)\b", re.IGNORECASE),
    # Programming requests — "write a function in python"
    re.compile(rf"\b(write|give|show|generate|create|build)\s+(me\s+)?(a\s+|an\s+|some\s+)?(code|script|program|function|snippet|class|method|api)\s+(?:to\s+\w+\s+)*(in|using|with)\s+({_PROG_LANGS})\b", re.IGNORECASE),
    # Generic "write/generate code" without language
    re.compile(r"\b(write|generate)\s+(some\s+)?code\b", re.IGNORECASE),
    re.compile(r"\b(fix|debug|optimize|refactor)\s+(my|this|the)\s+(code|script|function|program)\b", re.IGNORECASE),
    re.compile(rf"\bhow\s+(do\s+i\s+|to\s+)(write|code|program|implement)\s+(a|an|in)\s+({_PROG_LANGS}|loop|array|function|recursion)\b", re.IGNORECASE),
    re.compile(rf"\bexplain\s+(how\s+)?({_PROG_LANGS}|recursion|polymorphism|inheritance|api|rest|graphql|big-?o|algorithm)\b", re.IGNORECASE),
    re.compile(rf"\bwhat\s+is\s+({_PROG_LANGS}|recursion|polymorphism|inheritance|a\s+for\s+loop|a\s+while\s+loop|an?\s+algorithm|a\s+linked\s+list|a\s+hash\s+map)\b", re.IGNORECASE),
    re.compile(r"\b(react|angular|vue|django|flask|fastapi|nodejs|node\.js|express|spring\s+boot|next\.js|nuxt)\s+(code|tutorial|example|component|app)\b", re.IGNORECASE),

    # General knowledge / facts unrelated to the school
    re.compile(r"\bwhat\s+is\s+the\s+capital\s+of\b", re.IGNORECASE),
    re.compile(r"\bwho\s+(is|was)\s+(the\s+)?(president|prime\s+minister|king|queen|founder|inventor|ceo)\s+of\b", re.IGNORECASE),
    re.compile(r"\bwhen\s+(did|was)\s+\w+\s+(born|invented|founded|established|created)\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+(year|date)\s+(did|was|is)\b", re.IGNORECASE),
    re.compile(r"\b(translate|translation)\s+(this|the\s+following)\b", re.IGNORECASE),
    re.compile(r"\btranslate\s+(this\s+)?(to|into)\s+\w+\s+\w+", re.IGNORECASE),
    re.compile(r"\b(write|compose)\s+(a|an)\s+(poem|essay|story|song|joke|email\s+to\s+my)\b", re.IGNORECASE),
    re.compile(r"\bsolve\s+(this|the)\s+(equation|problem|math|integral|derivative)\b", re.IGNORECASE),
    re.compile(r"\bsolve\s+this\s+equation\b", re.IGNORECASE),
    re.compile(r"\bwhat'?s\s+\d+\s*[\+\-\*x×/÷]\s*\d+\b", re.IGNORECASE),
    re.compile(r"\b(weather|forecast|temperature)\s+(in|at|for|today|tomorrow)\b", re.IGNORECASE),
    re.compile(r"\b(news|latest|breaking)\s+(about|on|in)\b", re.IGNORECASE),

    # Identity probes / model probes
    re.compile(r"\bwhat\s+(model|llm|ai|version)\s+(are\s+you|do\s+you\s+use|is\s+powering\s+you|are\s+you\s+using)\b", re.IGNORECASE),
    re.compile(r"\bare\s+you\s+(chatgpt|gpt|claude|gemini|bard|copilot|llama)\b", re.IGNORECASE),
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

    for p in _OFFTOPIC_INTENT:
        if p.search(message):
            return "block_offtopic"

    return "ok"
