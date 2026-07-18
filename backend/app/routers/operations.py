from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, DBSetting
from app.schemas import SettingsUpdateRequest
from app.services.simulator import StadiumSimulator
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/operations", tags=["Operations Dashboard"])

@router.get("/telemetry")
def get_telemetry(db: Session = Depends(get_db)):
    try:
        return StadiumSimulator.get_stadium_telemetry(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation telemetry error: {str(e)}")

@router.get("/recommendations")
def get_ai_recommendations(db: Session = Depends(get_db)):
    try:
        telemetry = StadiumSimulator.get_stadium_telemetry(db)
        recs = GeminiService.generate_ops_recommendations(telemetry)
        return {"recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI recommendations generation error: {str(e)}")

@router.post("/settings")
def update_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    try:
        if payload.weather is not None:
            w_setting = db.query(DBSetting).filter(DBSetting.key == "weather").first()
            if w_setting:
                w_setting.value = payload.weather
            else:
                db.add(DBSetting(key="weather", value=payload.weather))
                
        if payload.match_time_minutes is not None:
            t_setting = db.query(DBSetting).filter(DBSetting.key == "match_time_minutes").first()
            if t_setting:
                t_setting.value = str(payload.match_time_minutes)
            else:
                db.add(DBSetting(key="match_time_minutes", value=str(payload.match_time_minutes)))
                
        if payload.attendance is not None:
            a_setting = db.query(DBSetting).filter(DBSetting.key == "attendance").first()
            if a_setting:
                a_setting.value = str(payload.attendance)
            else:
                db.add(DBSetting(key="attendance", value=str(payload.attendance)))
                
        db.commit()
        return {"status": "success", "message": "Simulation settings updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Settings update error: {str(e)}")
