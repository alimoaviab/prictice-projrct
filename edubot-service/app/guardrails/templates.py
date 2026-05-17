"""Pre-defined response templates for consistency and safety.

These are returned for known scenarios so the LLM doesn't get a chance to
hallucinate or over-share.
"""

REFUSAL_OUT_OF_SCOPE = (
    "I can only help with the Eduplexo platform and the data you have access "
    "to. I am not able to answer that. Try asking about students, attendance, "
    "exams, fees, timetable, or how to use a feature."
)

REFUSAL_PERMISSION_DENIED = (
    "You do not have permission to view that information. If you believe this "
    "is a mistake, please contact your school administrator."
)

REFUSAL_ANOTHER_USERS_DATA = (
    "I can only show information that belongs to you or your access scope. "
    "I cannot share data about other users, classes, or schools."
)

REFUSAL_BULK_EXPORT = (
    "For privacy reasons, I can show summaries and small samples, not full "
    "exports. To download data, please use the export feature in the relevant "
    "module."
)

REFUSAL_WRITE_OPERATION = (
    "I can read your school data, but I cannot make any changes for you. "
    "To create, update, or delete records, please use the relevant page in "
    "the app. I can guide you there if you would like."
)

ERROR_BACKEND_UNREACHABLE = (
    "I am having trouble reaching the school data right now. Please try again "
    "in a moment."
)

ERROR_GENERIC = (
    "Something went wrong while looking that up. Please try again."
)


# ─── Output structure templates the LLM is asked to follow ──────────────
# These are appended to the system prompt so replies are consistent.

RESPONSE_STRUCTURE_GUIDE = """
RESPONSE FORMAT RULES:

1. Always lead with a short, plain heading (no emojis, no asterisks).
2. Personalize the opening line using the user's first name when natural.
3. Use markdown TABLES for any structured data (counts, lists, comparisons,
   results, attendance breakdowns, fee summaries). Example:

   | Class | Students | Present Today |
   | --- | ---: | ---: |
   | Grade 5 | 32 | 30 |

4. Right-align numeric columns using the `---:` syntax.
5. Use bullet lists only for steps in a how-to. Max 6 short bullets.
6. Use **bold** for key labels, never for whole sentences.
7. Maximum 8 lines of prose unless the user explicitly asks for more.
8. Never list more than 5 individual people by name.
9. Never include internal IDs, raw JSON, or database fields.
10. Never reveal email addresses, phone numbers, CNIC, or addresses.
11. If the data is empty, say so in one sentence and suggest a next step.
12. Close with one short, action-oriented sentence telling the user the
    most useful thing to do next.
"""
