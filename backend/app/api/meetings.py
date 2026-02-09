from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, extract
from datetime import datetime, timedelta
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
    ParticipantResponse,
    CalendarMeetingResponse,
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
        start_time=payload.get("start_time"),
        end_time=payload.get("end_time"),
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


@router.post("/{meeting_id}/participants")
def add_participant(
    meeting_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a participant to a meeting."""
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    email = payload.get("email")
    name = payload.get("name", email.split("@")[0] if email else "Unknown")
    role = payload.get("role", "attendee")

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(name=name, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Check if already a participant
    existing = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == user.id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Participant already added")

    # Add participant
    link = MeetingParticipant(
        meeting_id=meeting_id,
        user_id=user.id,
        role=role,
    )
    db.add(link)
    db.commit()

    return {"message": "Participant added", "user_id": user.id}


@router.delete("/{meeting_id}/participants/{user_id}")
def remove_participant(
    meeting_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a participant from a meeting."""
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    link = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == user_id,
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.delete(link)
    db.commit()

    return {"message": "Participant removed"}


@router.put("/{meeting_id}")
def update_meeting(
    meeting_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update meeting details including start/end time."""
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if "title" in payload:
        meeting.title = payload["title"]
    if "platform" in payload:
        meeting.platform = payload["platform"]
    if "start_time" in payload:
        meeting.start_time = payload["start_time"]
    if "end_time" in payload:
        meeting.end_time = payload["end_time"]

    db.commit()
    db.refresh(meeting)

    return {"message": "Meeting updated", "meeting_id": meeting.id}


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


@router.get("/calendar")
def get_calendar_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    year: Optional[int] = Query(None, description="Year to filter"),
    month: Optional[int] = Query(None, description="Month to filter (1-12)"),
):
    """Get meetings for calendar view, optionally filtered by month."""
    query = db.query(Meeting).filter(Meeting.owner_id == current_user.id)

    # If year/month provided, filter by that month
    if year and month:
        # Filter by created_at or start_time within that month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        query = query.filter(
            or_(
                and_(Meeting.start_time >= start_date, Meeting.start_time < end_date),
                and_(Meeting.start_time.is_(None), Meeting.created_at >= start_date, Meeting.created_at < end_date),
            )
        )

    meetings = query.order_by(Meeting.created_at.desc()).all()

    result = []
    for m in meetings:
        # Count participants
        participant_count = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == m.id
        ).count()

        # Check if has extractions
        has_decisions = db.query(Decision).filter(Decision.meeting_id == m.id).first() is not None
        has_actions = db.query(ActionItem).filter(ActionItem.meeting_id == m.id).first() is not None

        result.append({
            "id": m.id,
            "title": m.title,
            "platform": m.platform,
            "start_time": m.start_time,
            "end_time": m.end_time,
            "created_at": m.created_at,
            "participant_count": participant_count,
            "has_extractions": has_decisions or has_actions,
        })

    return result


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

    # Get participants
    participant_links = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id
    ).all()

    participants = []
    for link in participant_links:
        user = db.query(User).get(link.user_id)
        if user:
            participants.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": link.role,
            })

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
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "transcript_id": transcript.id if transcript else None,
        "transcript_content": transcript.content if transcript else None,
        "has_extractions": len(decisions) > 0 or len(action_items) > 0,
        "participants": participants,
        "decisions": decisions,
        "action_items": action_items_response,
        "risks": risks,
    }