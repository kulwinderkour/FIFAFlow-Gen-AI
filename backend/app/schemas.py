from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class AccessibilitySettings(BaseModel):
    stairless: bool = False
    large_text: bool = False
    high_contrast: bool = False
    voice_support: bool = False

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Fan's natural language question")
    gate: Optional[str] = Field(None, max_length=20)
    seat: Optional[str] = Field(None, max_length=50)
    lang: str = Field("en", max_length=5)
    accessibility: Optional[AccessibilitySettings] = None

class QueryResponse(BaseModel):
    answer: str
    timestamp: str

class IncidentRequest(BaseModel):
    type: str = Field(..., max_length=50, description="Incident category")
    location: str = Field(..., max_length=100)
    description: str = Field(..., min_length=3, max_length=2000)
    reported_by: str = Field(..., max_length=100)

class IncidentResponse(BaseModel):
    id: int
    type: str
    location: str
    description: str
    reported_by: str
    status: str
    timestamp: datetime
    sop_steps: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    info_desk: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    weather: Optional[str] = Field(None, max_length=50)
    match_time_minutes: Optional[int] = Field(None, ge=0, le=120)
    attendance: Optional[int] = Field(None, ge=0, le=100000)

class EmergencySimulateRequest(BaseModel):
    type: str = Field(..., max_length=50, description="Emergency scenario type")
    severity: str = Field("medium", max_length=20)
