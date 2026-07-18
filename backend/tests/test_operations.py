"""
Tests for /api/operations — Telemetry, AI Recommendations, and Settings endpoints.
"""
import pytest
from unittest.mock import patch


class TestTelemetry:
    """GET /api/operations/telemetry"""

    def test_telemetry_returns_200(self, client):
        """Telemetry endpoint should return 200 with required stadium fields."""
        response = client.get("/api/operations/telemetry")
        assert response.status_code == 200
        data = response.json()
        assert "gates" in data
        assert "food_courts" in data
        assert "transit" in data
        assert "volunteers" in data
        assert "sustainability" in data
        assert "timestamp" in data

    def test_telemetry_gates_structure(self, client):
        """Each gate entry should have expected metrics."""
        data = client.get("/api/operations/telemetry").json()
        for gate_name, gate_data in data["gates"].items():
            assert "capacity" in gate_data
            assert "current_flow" in gate_data
            assert "status" in gate_data

    def test_telemetry_food_courts_structure(self, client):
        """Each food court entry should have wait time and stock level."""
        data = client.get("/api/operations/telemetry").json()
        for court_name, court_data in data["food_courts"].items():
            assert "wait_time_minutes" in court_data
            assert "stock_level" in court_data


class TestRecommendations:
    """GET /api/operations/recommendations"""

    def test_recommendations_returns_200(self, client):
        """Recommendations endpoint should return 200 with a list."""
        response = client.get("/api/operations/recommendations")
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)

    def test_recommendations_have_required_fields(self, client):
        """Each recommendation should have title, action, priority, department."""
        data = client.get("/api/operations/recommendations").json()
        recs = data["recommendations"]
        assert len(recs) > 0
        for rec in recs:
            assert "title" in rec
            assert "action" in rec
            assert "priority" in rec
            assert "department" in rec

    def test_recommendations_fallback_when_no_gemini(self, client):
        """Should return local fallback recommendations when Gemini is unavailable."""
        with patch("app.services.gemini_service.HAS_GEMINI_KEY", False):
            response = client.get("/api/operations/recommendations")
        assert response.status_code == 200
        assert len(response.json()["recommendations"]) > 0


class TestSettingsUpdate:
    """POST /api/operations/settings"""

    def test_update_weather_setting(self, client):
        """Should update weather and return success."""
        response = client.post("/api/operations/settings", json={"weather": "Rainy"})
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_update_match_time(self, client):
        """Should accept match time between 0 and 120 minutes."""
        response = client.post("/api/operations/settings", json={"match_time_minutes": 30})
        assert response.status_code == 200

    def test_update_attendance(self, client):
        """Should accept valid attendance values."""
        response = client.post("/api/operations/settings", json={"attendance": 65000})
        assert response.status_code == 200

    def test_invalid_match_time_rejected(self, client):
        """Match time above 120 should be rejected by validation."""
        response = client.post("/api/operations/settings", json={"match_time_minutes": 200})
        assert response.status_code == 422

    def test_invalid_attendance_rejected(self, client):
        """Attendance above 100000 should be rejected by validation."""
        response = client.post("/api/operations/settings", json={"attendance": 200000})
        assert response.status_code == 422

    def test_partial_update_allowed(self, client):
        """Settings endpoint accepts partial payloads (all fields optional)."""
        response = client.post("/api/operations/settings", json={})
        assert response.status_code == 200
