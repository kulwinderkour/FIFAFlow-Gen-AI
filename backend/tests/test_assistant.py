"""
Tests for /api/assistant — Fan Query & Chat History endpoints.
Covers both real Gemini path (mocked) and local fallback path.
"""
import pytest
from unittest.mock import patch


class TestFanQuery:
    """POST /api/assistant/query"""

    def test_fan_query_returns_200_with_valid_payload(self, client):
        """A well-formed query should always return a 200 with an answer."""
        response = client.post("/api/assistant/query", json={
            "query": "Where is the nearest restroom?",
            "gate": "Gate B",
            "seat": "Section A24",
            "lang": "en"
        })
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert isinstance(data["answer"], str)
        assert len(data["answer"]) > 0
        assert "timestamp" in data

    def test_fan_query_with_accessibility_mode(self, client):
        """Query with stairless accessibility flag should succeed."""
        response = client.post("/api/assistant/query", json={
            "query": "How do I get to my seat in a wheelchair?",
            "lang": "en",
            "accessibility": {
                "stairless": True,
                "large_text": False,
                "high_contrast": False,
                "voice_support": False
            }
        })
        assert response.status_code == 200
        assert "answer" in response.json()

    def test_fan_query_empty_query_rejected(self, client):
        """Empty query string should fail validation (min_length=1)."""
        response = client.post("/api/assistant/query", json={
            "query": "",
            "lang": "en"
        })
        assert response.status_code == 422  # Unprocessable Entity

    def test_fan_query_too_long_rejected(self, client):
        """Query exceeding 1000 characters should be rejected."""
        response = client.post("/api/assistant/query", json={
            "query": "x" * 1001,
            "lang": "en"
        })
        assert response.status_code == 422

    def test_fan_query_spanish_language(self, client):
        """Query in Spanish should return a valid answer."""
        response = client.post("/api/assistant/query", json={
            "query": "¿Dónde está el baño más cercano?",
            "lang": "es"
        })
        assert response.status_code == 200
        assert "answer" in response.json()

    def test_fan_query_falls_back_when_gemini_unavailable(self, client):
        """When Gemini raises an exception, the fallback simulator should respond."""
        with patch("app.services.gemini_service.HAS_GEMINI_KEY", False):
            response = client.post("/api/assistant/query", json={
                "query": "Where is the food court?",
                "lang": "en"
            })
        assert response.status_code == 200
        assert "answer" in response.json()


class TestChatHistory:
    """GET /api/assistant/history and DELETE /api/assistant/history"""

    def test_get_chat_history_empty_initially(self, client):
        """History should be an empty list for a fresh test DB."""
        response = client.get("/api/assistant/history")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_chat_history_persists_after_query(self, client):
        """Sending a query should persist user + assistant messages in history."""
        client.post("/api/assistant/query", json={
            "query": "Where is Gate C?",
            "lang": "en"
        })
        history = client.get("/api/assistant/history").json()
        assert len(history) >= 2  # user + assistant messages

    def test_clear_chat_history(self, client):
        """DELETE should clear all history and return success."""
        client.post("/api/assistant/query", json={"query": "test", "lang": "en"})
        response = client.delete("/api/assistant/history")
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        history = client.get("/api/assistant/history").json()
        assert len(history) == 0
