from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.meeting import Meeting

router = APIRouter(prefix="/alerts", tags=["alerts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{meeting_id}")
def get_alerts(meeting_id: str, db: Session = Depends(get_db)):
    alerts = []

    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        return []

    decisions = (
        db.query(Decision)
        .filter(Decision.meeting_id == meeting_id)
        .all()
    )

    actions = (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id == meeting_id)
        .all()
    )

    # 🔴 A1 — No outcomes
    if len(decisions) == 0 and len(actions) == 0:
        alerts.append({
            "id": "no_outcomes",
            "type": "meeting",
            "message": f"Meeting '{meeting.title}' produced no decisions or action items."
        })

    # 🟡 A2 — Owner missing
    for a in actions:
        if a.owner_id is None:
            alerts.append({
                "id": f"owner_missing_{a.id}",
                "type": "action_item",
                "message": f"Action item '{a.description}' has no owner."
            })

    # 🟠 A3 — Stale action items
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    for a in actions:
        if a.status == "open" and a.created_at < seven_days_ago:
            alerts.append({
                "id": f"stale_{a.id}",
                "type": "action_item",
                "message": f"Action item '{a.description}' has been open for over 7 days."
            })

    return alerts
