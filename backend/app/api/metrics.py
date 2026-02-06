from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem

router = APIRouter(prefix="/metrics", tags=["metrics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/meeting/{meeting_id}")
def get_meeting_metrics(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    decisions_count = (
        db.query(Decision)
        .filter(Decision.meeting_id == meeting_id)
        .count()
    )

    actions_count = (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id == meeting_id)
        .count()
    )

    # 🧠 Productivity logic
    if decisions_count == 0 and actions_count == 0:
        score = 0
        label = "waste_of_time"
    elif decisions_count > 0 and actions_count == 0:
        score = 1
        label = "needs_follow_up"
    else:
        score = 2
        label = "productive"

    return {
        "meeting_id": meeting_id,
        "decisions": decisions_count,
        "action_items": actions_count,
        "productivity_score": score,
        "classification": label,
    }
