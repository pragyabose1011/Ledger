# /Users/pragyabose/Ledger/backend/app/api/metrics.py
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/meeting/{meeting_id}")
def get_meeting_metrics(meeting_id: str, db: Session = Depends(get_db)):
    """Single meeting productivity metrics"""
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

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

    # Productivity score
    raw_score = (
        decisions_count * 2 +
        actions_with_owner * 3 +
        actions_without_owner * 1
    )

    # Classification
    if decisions_count == 0 and action_items_count == 0:
        label = "waste_of_time"
    elif decisions_count > 0 and action_items_count == 0:
        label = "needs_follow_up"
    else:
        label = "productive"

    # Average follow-up delay (time from creation to acknowledgment)
    acknowledged = [a for a in action_items if a.acknowledged_at]
    avg_followup_hours = None
    if acknowledged:
        delays = [(a.acknowledged_at - a.created_at).total_seconds() / 3600 for a in acknowledged]
        avg_followup_hours = sum(delays) / len(delays)

    return {
        "meeting_id": meeting_id,
        "decisions": decisions_count,
        "action_items": action_items_count,
        "productivity_score": raw_score,
        "classification": label,
        "actions_with_owner": actions_with_owner,
        "actions_without_owner": actions_without_owner,
        "has_outcomes": has_outcomes,
        "avg_followup_hours": round(avg_followup_hours, 1) if avg_followup_hours else None,
    }


@router.get("/weekly")
def get_weekly_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Weekly aggregate productivity metrics for current user's meetings.
    Returns last 4 weeks of data.
    """
    now = datetime.now(timezone.utc)
    four_weeks_ago = now - timedelta(weeks=4)

    # Get user's meetings from last 4 weeks
    meetings = (
        db.query(Meeting)
        .filter(
            Meeting.owner_id == current_user.id,
            Meeting.created_at >= four_weeks_ago,
        )
        .all()
    )

    if not meetings:
        return {"weeks": []}

    meeting_ids = [m.id for m in meetings]

    # Aggregate by week
    weeks_data = []
    for week_offset in range(4):
        week_start = now - timedelta(weeks=week_offset + 1)
        week_end = now - timedelta(weeks=week_offset)

        week_meetings = [m for m in meetings if week_start <= m.created_at < week_end]
        week_meeting_ids = [m.id for m in week_meetings]

        if not week_meeting_ids:
            weeks_data.append({
                "week_start": week_start.isoformat(),
                "meetings_count": 0,
                "decisions_count": 0,
                "action_items_count": 0,
                "avg_productivity_score": 0,
            })
            continue

        decisions_count = (
            db.query(Decision)
            .filter(Decision.meeting_id.in_(week_meeting_ids))
            .count()
        )

        action_items_count = (
            db.query(ActionItem)
            .filter(ActionItem.meeting_id.in_(week_meeting_ids))
            .count()
        )

        # Simple average score
        avg_score = (decisions_count * 2 + action_items_count * 3) / len(week_meeting_ids) if week_meeting_ids else 0

        weeks_data.append({
            "week_start": week_start.isoformat(),
            "meetings_count": len(week_meeting_ids),
            "decisions_count": decisions_count,
            "action_items_count": action_items_count,
            "avg_productivity_score": round(avg_score, 1),
        })

    return {"weeks": weeks_data}