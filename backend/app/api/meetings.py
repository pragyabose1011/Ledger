from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
from app.api.auth import get_current_user  # ← add this import

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
        owner_id=current_user.id,  # ← ownership
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
def list_meetings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meetings = db.query(Meeting).filter(Meeting.owner_id == current_user.id).order_by(Meeting.created_at.desc()).all()
    return meetings


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

    action_items_response = []
    for a in action_items:
        owner_name =  None
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

}


