from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.schemas import TransitPlanRequest
from app.security import reject_suspicious_query
from app.services.gemini_service import GeminiService
from app.services.simulator import StadiumSimulator

router = APIRouter(prefix="/transport", tags=["Transport Planner"])

@router.post("/plan")
@limiter.limit("10/minute")
def get_transit_plan(request: Request, payload: TransitPlanRequest, db: Session = Depends(get_db)):
    reject_suspicious_query(payload.query)

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
