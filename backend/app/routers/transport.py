from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.simulator import StadiumSimulator
from app.services.gemini_service import GeminiService
from pydantic import BaseModel

router = APIRouter(prefix="/transport", tags=["Transport Planner"])

class TransitPlanRequest(BaseModel):
    query: str
    lang: str = "en"

@router.post("/plan")
def get_transit_plan(payload: TransitPlanRequest, db: Session = Depends(get_db)):
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
