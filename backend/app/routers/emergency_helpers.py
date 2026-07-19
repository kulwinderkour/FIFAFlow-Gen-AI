"""Shared helpers for emergency router responses."""

import json
from typing import Any

from app.constants import INCLEMENT_WEATHER

CRISIS_SEVERITY_BY_TYPE = {
    "fire_alarm": "critical",
    "power_failure": "critical",
    "heavy_rain": "warning",
    "medical_emergency": "warning",
}


def parse_priority_actions(instructions: str | None) -> list[str]:
    """Parse stored crisis instructions into a list of priority actions."""
    if not instructions:
        return []

    if instructions.startswith("["):
        try:
            parsed = json.loads(instructions)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass

    return [step.strip("- ") for step in instructions.split("\n") if step.strip()]


def parse_sop_steps(raw_steps: str | None) -> list[str]:
    """Parse stored SOP steps from JSON or comma-separated text."""
    if not raw_steps:
        return []

    try:
        parsed = json.loads(raw_steps)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass

    return [step.strip() for step in raw_steps.split(",") if step.strip()]


def serialize_incident(incident: Any) -> dict[str, Any]:
    """Convert a DB incident row into an API response dictionary."""
    return {
        "id": incident.id,
        "type": incident.type,
        "location": incident.location,
        "description": incident.description,
        "reported_by": incident.reported_by,
        "status": incident.status,
        "timestamp": incident.timestamp,
        "sop_steps": parse_sop_steps(incident.sop_steps),
        "emergency_contact": incident.emergency_contact,
    }


def clear_active_crisis(crisis: Any, weather_setting: Any | None) -> None:
    """Reset crisis state and restore clear weather after storm simulations."""
    crisis.severity = "low"
    crisis.instructions = ""
    crisis.announcement = ""
    if weather_setting and weather_setting.value in INCLEMENT_WEATHER:
        weather_setting.value = "Clear"


def apply_crisis_plan(crisis: Any, crisis_type: str, ai_plan: dict[str, Any]) -> None:
    """Apply AI-generated emergency instructions to the active crisis record."""
    crisis.severity = ai_plan.get("severity", CRISIS_SEVERITY_BY_TYPE.get(crisis_type, "warning")).lower()
    priority_actions = ai_plan.get("priority_actions")
    if isinstance(priority_actions, list):
        crisis.instructions = "\n".join(priority_actions)
    else:
        crisis.instructions = ai_plan.get("evacuation_strategy", "")
    crisis.announcement = ai_plan.get("public_announcement", "")


def configure_crisis_weather(crisis_type: str, weather_setting: Any | None) -> None:
    """Align simulated weather with the selected emergency scenario."""
    if crisis_type != "heavy_rain" or not weather_setting:
        return
    weather_setting.value = "Heavy Rain"
