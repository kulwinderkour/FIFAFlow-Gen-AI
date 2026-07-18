from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, DBChatHistory
from app.schemas import QueryRequest, QueryResponse
from app.services.gemini_service import GeminiService
from app.services.simulator import StadiumSimulator
import datetime

router = APIRouter(prefix="/assistant", tags=["Fan Assistant"])

@router.post("/query", response_model=QueryResponse)
def fan_query(payload: QueryRequest, db: Session = Depends(get_db)):
    # 1. Fetch current stadium telemetry as context
    telemetry = StadiumSimulator.get_stadium_telemetry(db)
    
    # 2. Extract accessibility mode
    access_dict = payload.accessibility.model_dump() if payload.accessibility else {}
    
    # 3. Call AI service to answer the query
    answer = GeminiService.answer_fan_query(
        query=payload.query,
        context=telemetry,
        lang=payload.lang,
        accessibility_mode=access_dict
    )
    
    # 4. Save to chat history
    db.add(DBChatHistory(
        role="user",
        content=payload.query,
        user_role="fan"
    ))
    db.add(DBChatHistory(
        role="assistant",
        content=answer,
        user_role="fan"
    ))
    db.commit()
    
    return QueryResponse(
        answer=answer,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )

@router.get("/history")
def get_chat_history(db: Session = Depends(get_db)):
    history = db.query(DBChatHistory).order_by(DBChatHistory.timestamp.asc()).all()
    return [
        {
            "id": h.id,
            "role": h.role,
            "content": h.content,
            "timestamp": h.timestamp.isoformat(),
            "user_role": h.user_role
        }
        for h in history
    ]

@router.delete("/history")
def clear_chat_history(db: Session = Depends(get_db)):
    try:
        db.query(DBChatHistory).delete()
        db.commit()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
