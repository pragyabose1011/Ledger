from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta

from app.db.session import get_db
from app.db.models.meeting import Meeting
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.transcript import Transcript
from app.db.models.alert import Alert
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/dashboard")
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard metrics for the current user's meetings."""
    now = datetime.utcnow()
    four_weeks_ago = now - timedelta(weeks=4)

    # Count meetings in last 4 weeks (current user only)
    recent_meetings = (
        db.query(Meeting)
        .filter(
            Meeting.owner_id == current_user.id,
            (
                (Meeting.start_time != None) & (Meeting.start_time >= four_weeks_ago)
            )
            | (
                (Meeting.start_time == None) & (Meeting.created_at >= four_weeks_ago)
            ),
        )
        .count()
    )

    # If no recent meetings, count ALL of this user's meetings as fallback
    total_meetings = db.query(Meeting).filter(Meeting.owner_id == current_user.id).count()
    if recent_meetings == 0 and total_meetings > 0:
        recent_meetings = total_meetings

    # Recent meeting IDs for this user
    recent_meeting_ids = (
        db.query(Meeting.id)
        .filter(
            Meeting.owner_id == current_user.id,
            (
                (Meeting.start_time != None) & (Meeting.start_time >= four_weeks_ago)
            )
            | (
                (Meeting.start_time == None) & (Meeting.created_at >= four_weeks_ago)
            ),
        )
        .all()
    )
    meeting_ids = [m.id for m in recent_meeting_ids]

    if not meeting_ids:
        all_meetings = db.query(Meeting.id).filter(Meeting.owner_id == current_user.id).all()
        meeting_ids = [m.id for m in all_meetings]

    total_decisions = 0
    total_action_items = 0
    open_action_items = 0

    if meeting_ids:
        total_decisions = (
            db.query(Decision)
            .filter(Decision.meeting_id.in_(meeting_ids))
            .count()
        )
        total_action_items = (
            db.query(ActionItem)
            .filter(ActionItem.meeting_id.in_(meeting_ids))
            .count()
        )
        open_action_items = (
            db.query(ActionItem)
            .filter(
                ActionItem.meeting_id.in_(meeting_ids),
                ActionItem.status == "open",
            )
            .count()
        )

    completed_actions = total_action_items - open_action_items
    if recent_meetings > 0:
        raw_score = ((total_decisions + completed_actions) / recent_meetings) * 10
        productivity_score = round(min(raw_score, 10), 1)
    else:
        productivity_score = 0

    # Weekly metrics
    weekly_metrics = []
    for i in range(4):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)

        week_meeting_ids = (
            db.query(Meeting.id)
            .filter(
                Meeting.owner_id == current_user.id,
                (
                    (Meeting.start_time != None)
                    & (Meeting.start_time >= week_start)
                    & (Meeting.start_time < week_end)
                )
                | (
                    (Meeting.start_time == None)
                    & (Meeting.created_at >= week_start)
                    & (Meeting.created_at < week_end)
                ),
            )
            .all()
        )
        w_ids = [m.id for m in week_meeting_ids]

        w_meetings = len(w_ids)
        w_decisions = 0
        w_actions = 0

        if w_ids:
            w_decisions = (
                db.query(Decision).filter(Decision.meeting_id.in_(w_ids)).count()
            )
            w_actions = (
                db.query(ActionItem).filter(ActionItem.meeting_id.in_(w_ids)).count()
            )

        weekly_metrics.append(
            {
                "week": f"Week {4 - i}",
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "meetings": w_meetings,
                "decisions": w_decisions,
                "action_items": w_actions,
            }
        )

    weekly_metrics.reverse()

    # Alerts for this user's meetings
    user_meeting_ids = meeting_ids or []
    alerts = (
        db.query(Alert)
        .filter(Alert.meeting_id.in_(user_meeting_ids) if user_meeting_ids else Alert.id == None)
        .order_by(Alert.created_at.desc())
        .limit(10)
        .all()
    )

    alert_list = []
    for alert in alerts:
        meeting_title = ""
        if alert.meeting_id:
            meeting = db.query(Meeting).filter(Meeting.id == alert.meeting_id).first()
            if meeting:
                meeting_title = meeting.title or ""

        alert_list.append(
            {
                "id": alert.id,
                "type": getattr(alert, "type", "warning"),
                "message": alert.message if hasattr(alert, "message") else str(alert),
                "meeting_id": alert.meeting_id,
                "meeting_title": meeting_title,
                "created_at": str(alert.created_at) if alert.created_at else None,
            }
        )

    return {
        "meetings_count": recent_meetings,
        "decisions_count": total_decisions,
        "action_items_count": total_action_items,
        "open_action_items": open_action_items,
        "productivity_score": productivity_score,
        "weekly_metrics": weekly_metrics,
        "alerts": alert_list,
    }


@router.get("/meeting/{meeting_id}")
def get_meeting_metrics(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Per-meeting productivity metrics."""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    actions = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()

    completed = sum(1 for a in actions if a.status == "done")
    with_owner = sum(1 for a in actions if a.owner_id)
    total = len(decisions) + len(actions)

    if total > 0:
        score = round((len(decisions) + completed) / total * 10, 1)
    else:
        score = 0.0

    if score >= 7:
        classification = "productive"
    elif score >= 4:
        classification = "average"
    else:
        classification = "unproductive"

    return {
        "meeting_id": meeting_id,
        "decisions": len(decisions),
        "action_items": len(actions),
        "productivity_score": score,
        "classification": classification,
        "actions_with_owner": with_owner,
        "actions_without_owner": len(actions) - with_owner,
        "has_outcomes": total > 0,
    }
