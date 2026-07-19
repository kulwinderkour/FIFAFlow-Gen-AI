"""Shared application constants."""

DEFAULT_SETTINGS = {
    "weather": "Clear",
    "match_time_minutes": "45",
    "attendance": "68000",
    "active_crisis": "none",
}

SUSPICIOUS_QUERY_PATTERNS = (
    "ignore previous",
    "ignore the above",
    "system instruction",
    "system prompt",
    "bypass safety",
    "override instructions",
    "forget your instructions",
    "forget everything",
    "you are now a",
    "jailbreak",
    "dan mode",
    "developer mode",
    "disregard",
)

INCLEMENT_WEATHER = frozenset({"Rain", "Heavy Rain", "Storm"})
