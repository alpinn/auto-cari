"""Input sanitization for user queries.

Strips HTML, collapses whitespace, rejects obvious SQL-injection patterns,
and enforces length bounds. Raises ValueError on invalid input — callers
translate that into an HTTP 400.
"""

import re

MAX_QUERY_LEN = 300
MIN_QUERY_LEN = 3

_HTML_TAG_RE = re.compile(r"<[^>]*>")
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_WHITESPACE_RE = re.compile(r"\s+")

# Conservative SQL-injection signature check. We don't run user input as SQL
# (all DB access is parameterized), but reject blatant attempts defensively.
_SQLI_RE = re.compile(
    r"(\b(union\s+select|insert\s+into|drop\s+table|delete\s+from|update\s+\w+\s+set)\b"
    r"|(--|;|/\*|\*/)\s|0x[0-9a-f]+)",
    re.IGNORECASE,
)


class InvalidQueryError(ValueError):
    """Raised when a query fails sanitization."""


def sanitize_query(query: str) -> str:
    if query is None:
        raise InvalidQueryError("Query tidak boleh kosong.")

    cleaned = _HTML_TAG_RE.sub(" ", query)
    cleaned = _CONTROL_RE.sub("", cleaned)
    cleaned = _WHITESPACE_RE.sub(" ", cleaned).strip()

    if len(cleaned) < MIN_QUERY_LEN:
        raise InvalidQueryError("Query terlalu pendek. Minimal 3 karakter.")

    if len(cleaned) > MAX_QUERY_LEN:
        cleaned = cleaned[:MAX_QUERY_LEN].strip()

    if _SQLI_RE.search(cleaned):
        raise InvalidQueryError("Query mengandung pola yang tidak diizinkan.")

    return cleaned
