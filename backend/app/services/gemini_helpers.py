"""Shared helpers for Gemini response parsing."""

import json
from typing import Any


def strip_json_markdown(raw_response: str) -> str:
    """Remove common markdown fences from Gemini JSON responses."""
    return raw_response.strip().replace("```json", "").replace("```", "")


def parse_gemini_json(raw_response: str) -> Any:
    """Parse a Gemini JSON response after stripping markdown wrappers."""
    return json.loads(strip_json_markdown(raw_response))
