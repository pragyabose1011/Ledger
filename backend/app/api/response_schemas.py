from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MeetingListItem(BaseModel):
    id: str
    title: str
    platform: str
    created_at: datetime


class DecisionResponse(BaseModel):
    id: str
    summary: str
    created_at: datetime
    source_sentence: Optional[str] = None
    confidence: Optional[float] = None


class ActionItemResponse(BaseModel):
    id: str
    description: str
    status: str
    owner: Optional[str] = None
    created_at: datetime
    source_sentence: Optional[str] = None
    acknowledged_at: Optional[datetime] = None  # ← NEW
    confidence: Optional[float] = None

    class Config:
        from_attributes = True

class RiskResponse(BaseModel):
    id: str
    description: str
    created_at: datetime
    source_sentence: Optional[str] = None
    confidence: Optional[float] = None

class MeetingDetailResponse(BaseModel):
    id: str
    title: str
    platform: Optional[str]
    created_at: datetime

    transcript_id: Optional[str] = None
    transcript_content: Optional[str] = None
    has_extractions: bool

    decisions: List[DecisionResponse]
    action_items: List[ActionItemResponse]
    risks: List[RiskResponse]
    
