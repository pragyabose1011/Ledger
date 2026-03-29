from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.decision import Decision
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.post("/")
def create_decision(
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

    decision = Decision(
        meeting_id=payload["meeting_id"],
        summary=payload["summary"],
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return {"decision_id": decision.id}
