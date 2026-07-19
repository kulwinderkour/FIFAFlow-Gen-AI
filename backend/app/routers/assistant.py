from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import datetime

from app.database import get_db, DBChatHistory
from app.limiter import limiter
from app.schemas import QueryRequest, QueryResponse
from app.security import reject_suspicious_query
from app.services.gemini_service import GeminiService
from app.services.simulator import StadiumSimulator

router = APIRouter(prefix="/assistant", tags=["Fan Assistant"])


def _save_chat_exchange(db: Session, query: str, answer: str) -> None:
    """Persist a user query and assistant response to chat history."""
    db.add(DBChatHistory(role="user", content=query, user_role="fan"))
    db.add(DBChatHistory(role="assistant", content=answer, user_role="fan"))
    db.commit()

@router.post("/query", response_model=QueryResponse)
@limiter.limit("10/minute")
def fan_query(request: Request, payload: QueryRequest, db: Session = Depends(get_db)):
    reject_suspicious_query(payload.query)

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
    _save_chat_exchange(db, payload.query, answer)
    
    return QueryResponse(
        answer=answer,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )

@router.get("/history")
@limiter.limit("100/minute")
def get_chat_history(request: Request, db: Session = Depends(get_db)):
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
@limiter.limit("20/minute")
def clear_chat_history(request: Request, db: Session = Depends(get_db)):
    try:
        db.query(DBChatHistory).delete()
        db.commit()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
