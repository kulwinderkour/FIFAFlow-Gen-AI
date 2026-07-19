"""Shared security helpers for user-submitted text."""

from fastapi import HTTPException

from app.services.gemini_service import GeminiService

PROMPT_INJECTION_MESSAGE = "Potential security violation: Prompt injection detected."


def reject_suspicious_query(text: str) -> None:
    """Raise HTTP 400 when a query matches prompt-injection heuristics."""
    if GeminiService.is_suspicious_query(text):
        raise HTTPException(status_code=400, detail=PROMPT_INJECTION_MESSAGE)
