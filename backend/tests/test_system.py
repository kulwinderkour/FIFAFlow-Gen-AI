"""
Tests for /api/system/status and / (root health check) endpoints.
"""
import pytest
from unittest.mock import patch


class TestSystemStatus:
    """GET /api/system/status"""

    def test_system_status_returns_200(self, client):
        """System status endpoint should always return 200."""
        response = client.get("/api/system/status")
        assert response.status_code == 200

    def test_system_status_has_gemini_configured_field(self, client):
        """Response must contain a boolean gemini_api_configured field."""
        data = client.get("/api/system/status").json()
        assert "gemini_api_configured" in data
        assert isinstance(data["gemini_api_configured"], bool)

    def test_system_status_reflects_no_key(self, client):
        """When HAS_GEMINI_KEY is False, response should show False."""
        with patch("app.main.HAS_GEMINI_KEY", False):
            response = client.get("/api/system/status")
        assert response.status_code == 200
        assert response.json()["gemini_api_configured"] is False

    def test_system_status_reflects_key_present(self, client):
        """When HAS_GEMINI_KEY is True, response should show True."""
        with patch("app.main.HAS_GEMINI_KEY", True):
            response = client.get("/api/system/status")
        assert response.status_code == 200
        assert response.json()["gemini_api_configured"] is True


class TestRootHealthCheck:
    """GET /"""

    def test_root_returns_200(self, client):
        """Root health check endpoint should return 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_returns_healthy_status(self, client):
        """Root should report healthy status."""
        data = client.get("/").json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data
        assert "api_docs" in data
