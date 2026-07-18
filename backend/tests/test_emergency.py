"""
Tests for /api/emergency — Status, Simulate, Incidents, and Resolve endpoints.
"""
import pytest
from unittest.mock import patch


class TestEmergencyStatus:
    """GET /api/emergency/status"""

    def test_emergency_status_returns_200(self, client):
        """Status endpoint should return 200 with expected fields."""
        response = client.get("/api/emergency/status")
        assert response.status_code == 200
        data = response.json()
        assert "type" in data
        assert "severity" in data
        assert "announcement" in data
        assert "priority_actions" in data

    def test_default_emergency_type_is_none(self, client):
        """Fresh DB should show no active emergency."""
        response = client.get("/api/emergency/status")
        data = response.json()
        assert data["type"] == "none"


class TestEmergencySimulate:
    """POST /api/emergency/simulate"""

    def test_simulate_fire_alarm(self, client):
        """Simulating fire_alarm should return success and update crisis type."""
        response = client.post("/api/emergency/simulate", json={
            "type": "fire_alarm",
            "severity": "critical"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["details"]["type"] == "fire_alarm"

    def test_simulate_medical_emergency(self, client):
        """Simulating medical_emergency should return success."""
        response = client.post("/api/emergency/simulate", json={
            "type": "medical_emergency",
            "severity": "medium"
        })
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_simulate_heavy_rain(self, client):
        """Simulating heavy_rain should return success."""
        response = client.post("/api/emergency/simulate", json={
            "type": "heavy_rain",
            "severity": "warning"
        })
        assert response.status_code == 200

    def test_clear_emergency(self, client):
        """Setting type to 'none' should clear the active emergency."""
        client.post("/api/emergency/simulate", json={"type": "fire_alarm"})
        response = client.post("/api/emergency/simulate", json={"type": "none"})
        assert response.status_code == 200
        status = client.get("/api/emergency/status").json()
        assert status["type"] == "none"

    def test_simulate_type_too_long_rejected(self, client):
        """Type exceeding 50 characters should be rejected."""
        response = client.post("/api/emergency/simulate", json={
            "type": "x" * 51
        })
        assert response.status_code == 422

    def test_simulate_fallback_when_no_gemini(self, client):
        """Fallback plan should be returned when Gemini key is missing."""
        with patch("app.services.gemini_service.HAS_GEMINI_KEY", False):
            response = client.post("/api/emergency/simulate", json={
                "type": "power_failure"
            })
        assert response.status_code == 200


class TestIncidents:
    """POST, GET, and resolve incidents"""

    def test_report_incident_returns_201_or_200(self, client):
        """Reporting a new incident should return a valid incident object."""
        response = client.post("/api/emergency/incidents", json={
            "type": "medical",
            "location": "Section C Row 12",
            "description": "Fan has collapsed and appears unresponsive.",
            "reported_by": "Volunteer A. Smith"
        })
        assert response.status_code in (200, 201)
        data = response.json()
        assert "id" in data
        assert data["type"] == "medical"
        assert data["status"] == "active"

    def test_report_incident_description_too_short(self, client):
        """Description shorter than 3 characters should fail validation."""
        response = client.post("/api/emergency/incidents", json={
            "type": "security",
            "location": "Gate A",
            "description": "x",
            "reported_by": "Volunteer B"
        })
        assert response.status_code == 422

    def test_get_incidents_returns_list(self, client):
        """GET incidents should return a list."""
        response = client.get("/api/emergency/incidents")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_resolve_incident(self, client):
        """Resolving an existing incident should update its status."""
        created = client.post("/api/emergency/incidents", json={
            "type": "lost_child",
            "location": "Gate B Concourse",
            "description": "Child separated from family near Gate B.",
            "reported_by": "Security Officer K"
        }).json()

        inc_id = created["id"]
        response = client.post(f"/api/emergency/incidents/{inc_id}/resolve")
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_resolve_nonexistent_incident_returns_404(self, client):
        """Resolving an incident ID that doesn't exist should return 404."""
        response = client.post("/api/emergency/incidents/99999/resolve")
        assert response.status_code == 404
