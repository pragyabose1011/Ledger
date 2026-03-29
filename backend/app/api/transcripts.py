from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.transcript import Transcript
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/transcripts", tags=["transcripts"])


@router.post("/")
def upload_transcript(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == payload.get("meeting_id"),
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    existing = db.query(Transcript).filter(Transcript.meeting_id == payload["meeting_id"]).first()
    if existing:
        existing.content = payload["content"]
        db.commit()
        return {"transcript_id": existing.id}

    transcript = Transcript(
        meeting_id=payload["meeting_id"],
        content=payload["content"],
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return {"transcript_id": transcript.id}
