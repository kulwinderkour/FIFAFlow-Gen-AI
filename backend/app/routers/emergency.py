from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, DBEmergencyState, DBActiveIncident, DBSetting
from app.schemas import EmergencySimulateRequest, IncidentRequest, IncidentResponse
from app.services.simulator import StadiumSimulator
from app.services.gemini_service import GeminiService
import datetime
import json

router = APIRouter(prefix="/emergency", tags=["Emergency Decision Center"])

@router.get("/status")
def get_emergency_status(db: Session = Depends(get_db)):
    crisis = db.query(DBEmergencyState).filter(DBEmergencyState.key == "active_crisis").first()
    if not crisis:
        return {
            "type": "none",
            "severity": "low",
            "instructions": "",
            "announcement": "",
            "priority_actions": []
        }
    
    # Try to unpack priority actions
    priority_actions = []
    if crisis.instructions:
        try:
            # Check if instructions has priority list
            if crisis.instructions.startswith("["):
                priority_actions = json.loads(crisis.instructions)
            else:
                priority_actions = [step.strip("- ") for step in crisis.instructions.split("\n") if step.strip()]
        except Exception:
            priority_actions = [crisis.instructions]

    return {
        "type": crisis.type,
        "severity": crisis.severity,
        "instructions": crisis.instructions,
        "announcement": crisis.announcement,
        "priority_actions": priority_actions,
        "timestamp": crisis.timestamp.isoformat()
    }

@router.post("/simulate")
def simulate_emergency(payload: EmergencySimulateRequest, db: Session = Depends(get_db)):
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
            crisis.severity = "low"
            crisis.instructions = ""
            crisis.announcement = ""
            if weather_setting and weather_setting.value in ["Storm", "Heavy Rain"]:
                weather_setting.value = "Clear"
        else:
            # 1. Fetch latest telemetry for context
            telemetry = StadiumSimulator.get_stadium_telemetry(db)
            
            # Adjust global settings to match the crisis
            if payload.type == "heavy_rain":
                crisis.severity = "warning"
                if weather_setting:
                    weather_setting.value = "Heavy Rain"
            elif payload.type == "fire_alarm":
                crisis.severity = "critical"
            elif payload.type == "power_failure":
                crisis.severity = "critical"
            elif payload.type == "medical_emergency":
                crisis.severity = "warning"
                
            # 2. Call Gemini emergency analyzer
            ai_plan = GeminiService.analyze_emergency(payload.type, telemetry)
            
            crisis.severity = ai_plan.get("severity", "WARNING").lower()
            crisis.instructions = "\n".join(ai_plan.get("priority_actions", [])) if isinstance(ai_plan.get("priority_actions"), list) else ai_plan.get("evacuation_strategy", "")
            crisis.announcement = ai_plan.get("public_announcement", "")
            
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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Emergency simulation failed: {str(e)}")

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(DBActiveIncident).order_by(DBActiveIncident.timestamp.desc()).all()
    
    result = []
    for inc in incidents:
        # Unpack SOP steps from comma/json list if applicable
        sop_list = []
        if inc.sop_steps:
            try:
                sop_list = json.loads(inc.sop_steps)
            except Exception:
                sop_list = [step.strip() for step in inc.sop_steps.split(",") if step.strip()]
                
        result.append({
            "id": inc.id,
            "type": inc.type,
            "location": inc.location,
            "description": inc.description,
            "reported_by": inc.reported_by,
            "status": inc.status,
            "timestamp": inc.timestamp,
            "sop_steps": sop_list,
            "emergency_contact": inc.emergency_contact
        })
    return result

@router.post("/incidents", response_model=IncidentResponse)
def report_incident(payload: IncidentRequest, db: Session = Depends(get_db)):
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
def resolve_incident(incident_id: int, db: Session = Depends(get_db)):
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
