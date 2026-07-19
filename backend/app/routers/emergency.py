from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import datetime
import json

from app.database import get_db, DBEmergencyState, DBActiveIncident, DBSetting
from app.limiter import limiter
from app.routers.emergency_helpers import (
    CRISIS_SEVERITY_BY_TYPE,
    apply_crisis_plan,
    clear_active_crisis,
    configure_crisis_weather,
    parse_priority_actions,
    serialize_incident,
)
from app.schemas import EmergencySimulateRequest, IncidentRequest, IncidentResponse
from app.security import reject_suspicious_query
from app.services.gemini_service import GeminiService
from app.services.simulator import StadiumSimulator

router = APIRouter(prefix="/emergency", tags=["Emergency Decision Center"])

@router.get("/status")
@limiter.limit("100/minute")
def get_emergency_status(request: Request, db: Session = Depends(get_db)):
    crisis = db.query(DBEmergencyState).filter(DBEmergencyState.key == "active_crisis").first()
    if not crisis:
        return {
            "type": "none",
            "severity": "low",
            "instructions": "",
            "announcement": "",
            "priority_actions": []
        }

    return {
        "type": crisis.type,
        "severity": crisis.severity,
        "instructions": crisis.instructions,
        "announcement": crisis.announcement,
        "priority_actions": parse_priority_actions(crisis.instructions),
        "timestamp": crisis.timestamp.isoformat()
    }

@router.post("/simulate")
@limiter.limit("10/minute")
def simulate_emergency(request: Request, payload: EmergencySimulateRequest, db: Session = Depends(get_db)):
    try:
        crisis = db.query(DBEmergencyState).filter(DBEmergencyState.key == "active_crisis").first()
        if not crisis:
            crisis = DBEmergencyState(key="active_crisis")
            db.add(crisis)
            
        crisis.type = payload.type
        crisis.timestamp = datetime.datetime.now(datetime.timezone.utc)
        
        # Modify stadium global weather or operational settings depending on crisis
        weather_setting = db.query(DBSetting).filter(DBSetting.key == "weather").first()
        
        if payload.type == "none":
            clear_active_crisis(crisis, weather_setting)
        else:
            telemetry = StadiumSimulator.get_stadium_telemetry(db)
            configure_crisis_weather(payload.type, weather_setting)
            crisis.severity = CRISIS_SEVERITY_BY_TYPE.get(payload.type, "warning")

            ai_plan = GeminiService.analyze_emergency(payload.type, telemetry)
            apply_crisis_plan(crisis, payload.type, ai_plan)
            
        db.commit()
        return {
            "status": "success",
            "message": f"Emergency mode changed to {payload.type}",
            "details": {
                "type": crisis.type,
                "severity": crisis.severity,
                "announcement": crisis.announcement
            }
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Emergency simulation failed: {exc}") from exc

@router.get("/incidents")
@limiter.limit("100/minute")
def get_incidents(request: Request, db: Session = Depends(get_db)):
    incidents = db.query(DBActiveIncident).order_by(DBActiveIncident.timestamp.desc()).all()
    return [serialize_incident(inc) for inc in incidents]

@router.post("/incidents", response_model=IncidentResponse)
@limiter.limit("10/minute")
def report_incident(request: Request, payload: IncidentRequest, db: Session = Depends(get_db)):
    reject_suspicious_query(payload.description)

    try:
        # 1. Fetch current context
        telemetry = StadiumSimulator.get_stadium_telemetry(db)
        
        # 2. Call AI SOP generator
        ai_sop = GeminiService.answer_volunteer_query(payload.description, telemetry)
        
        # 3. Create active incident record
        sop_steps_json = json.dumps(ai_sop.get("sop_steps", []))
        
        incident = DBActiveIncident(
            type=payload.type,
            location=payload.location,
            description=payload.description,
            reported_by=payload.reported_by,
            status="active",
            sop_steps=sop_steps_json,
            emergency_contact=ai_sop.get("emergency_contact", "Main Control Room")
        )
        
        db.add(incident)
        db.commit()
        db.refresh(incident)
        
        return IncidentResponse(
            id=incident.id,
            type=incident.type,
            location=incident.location,
            description=incident.description,
            reported_by=incident.reported_by,
            status=incident.status,
            timestamp=incident.timestamp,
            sop_steps=ai_sop.get("sop_steps", []),
            emergency_contact=incident.emergency_contact,
            info_desk=ai_sop.get("info_desk", "Gate A Main Desk")
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log volunteer incident: {str(e)}")

@router.post("/incidents/{incident_id}/resolve")
@limiter.limit("60/minute")
def resolve_incident(request: Request, incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(DBActiveIncident).filter(DBActiveIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    try:
        incident.status = "resolved"
        db.commit()
        return {"status": "success", "message": f"Incident {incident_id} marked as resolved"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
