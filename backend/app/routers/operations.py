from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db_utils import upsert_setting
from app.database import get_db
from app.limiter import limiter
from app.schemas import SettingsUpdateRequest
from app.services.gemini_service import GeminiService
from app.services.simulator import StadiumSimulator

router = APIRouter(prefix="/operations", tags=["Operations Dashboard"])

@router.get("/telemetry")
@limiter.limit("100/minute")
def get_telemetry(request: Request, db: Session = Depends(get_db)):
    try:
        return StadiumSimulator.get_stadium_telemetry(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation telemetry error: {str(e)}")

@router.get("/recommendations")
@limiter.limit("10/minute")
def get_ai_recommendations(request: Request, db: Session = Depends(get_db)):
    try:
        telemetry = StadiumSimulator.get_stadium_telemetry(db)
        recs = GeminiService.generate_ops_recommendations(telemetry)
        return {"recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI recommendations generation error: {str(e)}")

@router.post("/settings")
@limiter.limit("60/minute")
def update_settings(request: Request, payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    try:
        if payload.weather is not None:
            upsert_setting(db, "weather", payload.weather)
        if payload.match_time_minutes is not None:
            upsert_setting(db, "match_time_minutes", str(payload.match_time_minutes))
        if payload.attendance is not None:
            upsert_setting(db, "attendance", str(payload.attendance))

        db.commit()
        return {"status": "success", "message": "Simulation settings updated"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Settings update error: {exc}") from exc
