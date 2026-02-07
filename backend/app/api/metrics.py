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
    # Ensure meeting exists
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # --- Basic counts ---
    decisions_count = (
        db.query(Decision)
        .filter(Decision.meeting_id == meeting_id)
        .count()
    )

    action_items = (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id == meeting_id)
        .all()
    )

    action_items_count = len(action_items)
    actions_with_owner = len([a for a in action_items if a.owner_id])
    actions_without_owner = action_items_count - actions_with_owner

    has_outcomes = decisions_count > 0 or action_items_count > 0

    # --- Numeric productivity score (first version) ---
    raw_score = (
        decisions_count * 2 +
        actions_with_owner * 3 +
        actions_without_owner * 1
    )

    # --- Classification label (second version) ---
    if decisions_count == 0 and action_items_count == 0:
        label = "waste_of_time"
    elif decisions_count > 0 and action_items_count == 0:
        label = "needs_follow_up"
    else:
        label = "productive"

    # For the frontend, keep these core fields:
    return {
        "meeting_id": meeting_id,
        # fields your React `Metrics` type expects:
        "decisions": decisions_count,
        "action_items": action_items_count,
        "productivity_score": raw_score,
        "classification": label,
        # extra detailed fields if you want them later:
        "actions_with_owner": actions_with_owner,
        "actions_without_owner": actions_without_owner,
        "has_outcomes": has_outcomes,
    }