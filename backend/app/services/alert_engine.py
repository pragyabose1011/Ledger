from datetime import datetime, timezone

from app.db.models.alert import Alert
from app.db.models.action_item import ActionItem
from app.db.models.decision import Decision
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.services.notifier import notify


def run_alerts_for_meeting(db, meeting_id: str):
    # clear old alerts for idempotency
    db.query(Alert).filter(Alert.meeting_id == meeting_id).delete()

    # Get meeting + owner email once
    meeting = db.query(Meeting).get(meeting_id)
    meeting_owner_email = None
    if meeting and meeting.owner_id:
        owner = db.query(User).get(meeting.owner_id)
        meeting_owner_email = owner.email if owner else None

    # --- ALERT A: Action item without owner ---
    no_owner_items = (
        db.query(ActionItem)
        .filter(
            ActionItem.meeting_id == meeting_id,
            ActionItem.owner_id.is_(None),
        )
        .all()
    )

    for item in no_owner_items:
        alert = Alert(
            meeting_id=meeting_id,
            action_item_id=item.id,
            type="no_owner",
            message=f"Action item '{item.description}' has no owner."
        )
        db.add(alert)
        notify(alert, email=meeting_owner_email)

    # --- ALERT B: Overdue action items ---
    now = datetime.now(timezone.utc)

    overdue_items = (
        db.query(ActionItem)
        .filter(
            ActionItem.meeting_id == meeting_id,
            ActionItem.due_date.isnot(None),
            ActionItem.due_date < now,
            ActionItem.status != "done"
        )
        .all()
    )

    for item in overdue_items:
        days = (now - item.due_date).days
        alert = Alert(
            meeting_id=meeting_id,
            action_item_id=item.id,
            type="overdue",
            message=f"Action item '{item.description}' is overdue by {days} days."
        )
        db.add(alert)

        # Prefer the action item's owner email; fall back to meeting owner
        owner_email = None
        if item.owner_id and item.owner:
            owner_email = item.owner.email
        elif meeting_owner_email:
            owner_email = meeting_owner_email

        notify(alert, email=owner_email)

    # --- ALERT C: No outcomes ---
    decision_count = db.query(Decision).filter(
        Decision.meeting_id == meeting_id
    ).count()

    action_count = db.query(ActionItem).filter(
        ActionItem.meeting_id == meeting_id
    ).count()

    if decision_count == 0 and action_count == 0 and meeting:
        alert = Alert(
            meeting_id=meeting_id,
            type="no_outcomes",
            message=f"Meeting '{meeting.title}' produced no decisions or action items."
        )
        db.add(alert)
        notify(alert, email=meeting_owner_email)

    db.commit()