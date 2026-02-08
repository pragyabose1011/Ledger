from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.models.transcript import Transcript

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.db.models.meeting_participant import MeetingParticipant
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.api.response_schemas import (
    MeetingListItem,
    MeetingDetailResponse,
    DecisionResponse,
    ActionItemResponse,
)
from app.api.auth import get_current_user
from app.db.models.risk import Risk

router = APIRouter(prefix="/meetings", tags=["meetings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# WRITE API
# -------------------------
@router.post("/")
def create_meeting(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = Meeting(
        title=payload["title"],
        platform=payload.get("platform"),
        owner_id=current_user.id,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    for p in payload.get("participants", []):
        user = db.query(User).filter(User.email == p["email"]).first()
        if not user:
            user = User(
                name=p["name"],
                email=p["email"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        link = MeetingParticipant(
            meeting_id=meeting.id,
            user_id=user.id,
            role=p.get("role"),
        )
        db.add(link)

    db.commit()
    return {"meeting_id": meeting.id}


# -------------------------
# READ APIs
# -------------------------
@router.get("/", response_model=List[MeetingListItem])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    q: Optional[str] = Query(None, description="Search query for title, decisions, or action items"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
):
    """List meetings with optional search and filter."""
    query = db.query(Meeting).filter(Meeting.owner_id == current_user.id)
    
    # Search across title, decisions, and action items
    if q:
        search_term = f"%{q.lower()}%"
        
        # Get meeting IDs that match in decisions
        decision_meeting_ids = (
            db.query(Decision.meeting_id)
            .filter(Decision.summary.ilike(search_term))
            .distinct()
            .all()
        )
        decision_meeting_ids = [m[0] for m in decision_meeting_ids]
        
        # Get meeting IDs that match in action items
        action_meeting_ids = (
            db.query(ActionItem.meeting_id)
            .filter(ActionItem.description.ilike(search_term))
            .distinct()
            .all()
        )
        action_meeting_ids = [m[0] for m in action_meeting_ids]
        
        # Get meeting IDs that match in transcript content
        transcript_meeting_ids = (
            db.query(Transcript.meeting_id)
            .filter(Transcript.content.ilike(search_term))
            .distinct()
            .all()
        )
        transcript_meeting_ids = [m[0] for m in transcript_meeting_ids]
        
        # Combine: title match OR related records match
        all_related_ids = set(decision_meeting_ids + action_meeting_ids + transcript_meeting_ids)
        
        query = query.filter(
            or_(
                Meeting.title.ilike(search_term),
                Meeting.id.in_(all_related_ids)
            )
        )
    
    # Filter by platform
    if platform:
        query = query.filter(Meeting.platform == platform)
    
    meetings = query.order_by(Meeting.created_at.desc()).all()
    return meetings


@router.get("/search/suggestions")
def get_search_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get unique platforms and recent search terms for suggestions."""
    # Get unique platforms
    platforms = (
        db.query(Meeting.platform)
        .filter(Meeting.owner_id == current_user.id)
        .filter(Meeting.platform.isnot(None))
        .distinct()
        .all()
    )
    platforms = [p[0] for p in platforms if p[0]]
    
    # Get recent meeting titles for suggestions
    recent_titles = (
        db.query(Meeting.title)
        .filter(Meeting.owner_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .limit(5)
        .all()
    )
    recent_titles = [t[0] for t in recent_titles]
    
    return {
        "platforms": platforms,
        "recent_titles": recent_titles,
    }


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    decisions = (
        db.query(Decision)
        .filter(Decision.meeting_id == meeting_id)
        .order_by(Decision.created_at.desc())
        .all()
    )

    action_items = (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id == meeting_id)
        .order_by(ActionItem.created_at.desc())
        .all()
    )

    risks = (
        db.query(Risk)
        .filter(Risk.meeting_id == meeting_id)
        .order_by(Risk.created_at.desc())
        .all()
    )

    action_items_response = []
    for a in action_items:
        owner_name = None
        if a.owner_id:
            user = db.query(User).get(a.owner_id)
            owner_name = user.name if user else None

        action_items_response.append({
            "id": a.id,
            "description": a.description,
            "status": a.status,
            "owner": owner_name,
            "source_sentence": a.source_sentence,
            "created_at": a.created_at,
            "acknowledged_at": a.acknowledged_at,
            "confidence": a.confidence,
        })

    transcript = (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting_id)
        .order_by(Transcript.created_at.desc())
        .first()
    )

    return {
        "id": meeting.id,
        "title": meeting.title,
        "platform": meeting.platform,
        "created_at": meeting.created_at,
        "transcript_id": transcript.id if transcript else None,
        "transcript_content": transcript.content if transcript else None,
        "has_extractions": len(decisions) > 0 or len(action_items) > 0,
        "decisions": decisions,
        "action_items": action_items_response,
        "risks": risks,
    }