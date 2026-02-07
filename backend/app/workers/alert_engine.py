from datetime import datetime, timezone, timedelta

from app.db.models.alert import Alert
from app.db.models.action_item import ActionItem
from app.db.models.decision import Decision
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.db.models.risk import Risk
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

    now = datetime.now(timezone.utc)

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

    # --- ALERT D: Action item never acknowledged ---
    two_days_ago = now - timedelta(days=2)

    unacknowledged_items = (
        db.query(ActionItem)
        .filter(
            ActionItem.meeting_id == meeting_id,
            ActionItem.status == "open",
            ActionItem.owner_id.isnot(None),
            ActionItem.acknowledged_at.is_(None),
            ActionItem.created_at < two_days_ago,
        )
        .all()
    )

    for item in unacknowledged_items:
        alert = Alert(
            meeting_id=meeting_id,
            action_item_id=item.id,
            type="never_acknowledged",
            message=f"Action item '{item.description}' assigned to {item.owner.name if item.owner else 'unknown'} has not been acknowledged."
        )
        db.add(alert)

        owner_email = None
        if item.owner_id and item.owner:
            owner_email = item.owner.email

        notify(alert, email=owner_email)

    # --- ALERT E: Decision without owner ---
    no_owner_decisions = (
        db.query(Decision)
        .filter(
            Decision.meeting_id == meeting_id,
            Decision.owner_id.is_(None),
        )
        .all()
    )

    for dec in no_owner_decisions:
        alert = Alert(
            meeting_id=meeting_id,
            type="decision_no_owner",
            message=f"Decision '{dec.summary}' has no owner."
        )
        db.add(alert)
        notify(alert, email=meeting_owner_email)

    db.commit()


def detect_repeated_issues(db, meeting_id: str):
    """
    Detect risks/blockers that appear in multiple recent meetings.
    """
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting or not meeting.owner_id:
        return

    current_risks = db.query(Risk).filter(Risk.meeting_id == meeting_id).all()
    if not current_risks:
        return

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_meetings = (
        db.query(Meeting)
        .filter(
            Meeting.owner_id == meeting.owner_id,
            Meeting.created_at >= thirty_days_ago,
            Meeting.id != meeting_id,
        )
        .all()
    )

    if not recent_meetings:
        return

    recent_meeting_ids = [m.id for m in recent_meetings]

    past_risks = (
        db.query(Risk)
        .filter(Risk.meeting_id.in_(recent_meeting_ids))
        .all()
    )

    if not past_risks:
        return

    stopwords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}

    for current_risk in current_risks:
        current_words = set(current_risk.description.lower().split())

        matches = []
        for past_risk in past_risks:
            past_words = set(past_risk.description.lower().split())
            overlap = (current_words & past_words) - stopwords
            if len(overlap) >= 3:
                matches.append(past_risk)

        if len(matches) >= 2:
            alert = Alert(
                meeting_id=meeting_id,
                type="repeated_issue",
                message=f"Risk '{current_risk.description}' has appeared in {len(matches)} recent meetings. This issue keeps recurring."
            )
            db.add(alert)

            owner = db.query(User).get(meeting.owner_id)
            owner_email = owner.email if owner else None
            notify(alert, email=owner_email)

    db.commit()