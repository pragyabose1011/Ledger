"""API endpoints for notification management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import SessionLocal
from app.db.models.action_item import ActionItem
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.api.auth import get_current_user
from app.services.email_notifier import (
    send_action_item_reminder,
    send_weekly_digest,
    is_email_configured,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestEmailRequest(BaseModel):
    email: str
    type: str = "test"  # test, reminder, digest


@router.get("/status")
def get_notification_status():
    """Check if email notifications are configured."""
    return {
        "email_configured": is_email_configured(),
        "message": "Email ready" if is_email_configured() else "Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars",
    }


@router.post("/test")
def send_test_notification(
    request: TestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a test notification email."""
    from app.services.email_notifier import send_email
    
    success = send_email(
        to=request.email,
        subject="[Ledger] Test notification",
        body=f"Hi {current_user.name},\n\nThis is a test email from Ledger. If you received this, email notifications are working!\n\n— Ledger",
    )
    
    return {
        "success": success,
        "message": "Test email sent" if success else "Email not configured or failed to send",
    }


@router.post("/send-reminders")
def trigger_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger sending of due date reminders (admin only)."""
    from datetime import datetime, timedelta, timezone
    
    now = datetime.now(timezone.utc)
    three_days_from_now = now + timedelta(days=3)
    
    # Find open action items with due dates
    items = (
        db.query(ActionItem)
        .filter(ActionItem.status == "open")
        .filter(ActionItem.due_date.isnot(None))
        .filter(ActionItem.due_date <= three_days_from_now)
        .filter(ActionItem.owner_id.isnot(None))
        .all()
    )
    
    sent_count = 0
    skipped_count = 0
    
    for item in items:
        owner = db.query(User).filter(User.id == item.owner_id).first()
        meeting = db.query(Meeting).filter(Meeting.id == item.meeting_id).first()
        
        if not owner or not meeting:
            skipped_count += 1
            continue
        
        due_date = item.due_date
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)
        
        days_until_due = (due_date.date() - now.date()).days
        
        success = send_action_item_reminder(
            to_email=owner.email,
            to_name=owner.name,
            action_description=item.description,
            meeting_title=meeting.title,
            due_date=due_date.strftime("%Y-%m-%d"),
            days_until_due=days_until_due,
        )
        if success:
            sent_count += 1
    
    return {
        "sent": sent_count,
        "skipped": skipped_count,
        "total_eligible": len(items),
    }