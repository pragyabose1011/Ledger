from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MeetingListItem(BaseModel):
    id: str
    title: str
    platform: Optional[str] = None
    created_at: datetime
    start_time: Optional[datetime] = None  # For calendar view


class ParticipantResponse(BaseModel):
    id: str
    name: str
    email: str
    role: Optional[str] = None

    class Config:
        from_attributes = True


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
    acknowledged_at: Optional[datetime] = None
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
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    transcript_id: Optional[str] = None
    transcript_content: Optional[str] = None
    has_extractions: bool

    participants: List[ParticipantResponse] = []  # NEW
    decisions: List[DecisionResponse]
    action_items: List[ActionItemResponse]
    risks: List[RiskResponse]


class CalendarMeetingResponse(BaseModel):
    """Lightweight meeting response for calendar view."""
    id: str
    title: str
    platform: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    participant_count: int = 0
    has_extractions: bool = False