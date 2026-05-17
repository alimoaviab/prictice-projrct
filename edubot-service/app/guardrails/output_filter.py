"""Output guardrails — strip PII, cap response size, detect leakage.

Run on every assistant reply BEFORE returning to the user.
"""

import re

import structlog

logger = structlog.get_logger()


# ─── PII redaction patterns ──────────────────────────────────────────────
# These never appear in legitimate replies. If the model accidentally echoes
# back something that looks like one, we redact it.

_PII_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # Email addresses
    (re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b"), "[email redacted]"),
    # Internal UUID-like IDs (must run BEFORE phone/number patterns to avoid
    # matching the digit-rich tail of a UUID).
    (
        re.compile(
            r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b",
            re.IGNORECASE,
        ),
        "[id]",
    ),
    # Phone numbers (international + local Pakistani patterns)
    (re.compile(r"\+?\d{1,3}[\s-]?\d{3,4}[\s-]?\d{6,8}"), "[phone redacted]"),
    # CNIC (Pakistani national ID): 5 digit - 7 digit - 1 digit
    (re.compile(r"\b\d{5}-?\d{7}-?\d\b"), "[cnic redacted]"),
    # Credit card-like 13–19 digit runs
    (re.compile(r"\b\d{13,19}\b"), "[number redacted]"),
]

# ─── Phrases that indicate prompt-leakage or jailbreak success ───────────

_LEAKAGE_PATTERNS = [
    re.compile(r"system prompt", re.IGNORECASE),
    re.compile(r"ignore (previous|all) instructions", re.IGNORECASE),
    re.compile(r"my instructions are", re.IGNORECASE),
    re.compile(r"as an ai (language )?model", re.IGNORECASE),
]

MAX_REPLY_LENGTH = 4000  # characters


def filter_reply(reply: str) -> tuple[str, dict]:
    """Run all output guardrails on a reply.

    Returns (filtered_reply, audit_info).
    audit_info: { redacted: bool, truncated: bool, leakage_detected: bool,
                  dashes_replaced: bool }
    """
    audit = {
        "redacted": False,
        "truncated": False,
        "leakage_detected": False,
        "dashes_replaced": False,
    }

    if not reply:
        return "I don't have an answer for that right now.", audit

    out = reply

    # 0. Replace AI-style em/en dashes with commas, but keep
    #    markdown table delimiters (`---`, `---:`, `:---`) intact.
    def _replace_dashes(text: str) -> tuple[str, bool]:
        changed = False
        # Em dash and en dash → comma
        new = re.sub(r"\s*[—–]\s*", ", ", text)
        if new != text:
            changed = True
            text = new
        # Triple ASCII hyphen with surrounding spaces → comma (avoid table rows)
        # Only replace when NOT preceded/followed by `|` (markdown table separator).
        new = re.sub(r"(?<![|\-:])\s+---\s+(?![|\-:])", ", ", text)
        if new != text:
            changed = True
            text = new
        return text, changed

    out, dashes_changed = _replace_dashes(out)
    audit["dashes_replaced"] = dashes_changed

    # 1. PII redaction
    for pattern, replacement in _PII_PATTERNS:
        new = pattern.sub(replacement, out)
        if new != out:
            audit["redacted"] = True
            out = new

    # 2. Leakage detection
    for pattern in _LEAKAGE_PATTERNS:
        if pattern.search(out):
            audit["leakage_detected"] = True
            logger.warning("response_leakage_detected", pattern=pattern.pattern)
            return (
                "I can only help with questions about using Eduplexo and your "
                "school data within your access. Please rephrase your question.",
                audit,
            )

    # 3. Length cap
    if len(out) > MAX_REPLY_LENGTH:
        out = out[:MAX_REPLY_LENGTH].rstrip() + "."
        audit["truncated"] = True

    return out, audit
