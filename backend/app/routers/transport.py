from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.simulator import StadiumSimulator
from app.services.gemini_service import GeminiService
from app.limiter import limiter
from pydantic import BaseModel

router = APIRouter(prefix="/transport", tags=["Transport Planner"])

class TransitPlanRequest(BaseModel):
    query: str
    lang: str = "en"

@router.post("/plan")
@limiter.limit("10/minute")
def get_transit_plan(request: Request, payload: TransitPlanRequest, db: Session = Depends(get_db)):
    # Security Check: Prompt Injection Sanitization
    if GeminiService.is_suspicious_query(payload.query):
        raise HTTPException(status_code=400, detail="Potential security violation: Prompt injection detected.")

    try:
        telemetry = StadiumSimulator.get_stadium_telemetry(db)
        plan = GeminiService.plan_transport(payload.query, telemetry, payload.lang)
        return {
            "query": payload.query,
            "plan": plan,
            "transit_status": telemetry["transit"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transport planning error: {str(e)}")
