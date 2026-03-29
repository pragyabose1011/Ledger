from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/{meeting_id}")
def get_alerts(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    alerts = []
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    actions = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()

    if len(decisions) == 0 and len(actions) == 0:
        alerts.append({
            "id": "no_outcomes",
            "type": "meeting",
            "message": f"Meeting '{meeting.title}' produced no decisions or action items.",
        })

    for a in actions:
        if a.owner_id is None:
            alerts.append({
                "id": f"owner_missing_{a.id}",
                "type": "action_item",
                "message": f"Action item '{a.description}' has no owner.",
            })

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    for a in actions:
        if a.status == "open" and a.created_at < seven_days_ago:
            alerts.append({
                "id": f"stale_{a.id}",
                "type": "action_item",
                "message": f"Action item '{a.description}' has been open for over 7 days.",
            })

    return alerts
