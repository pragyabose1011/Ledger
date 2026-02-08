"""
Background worker for sending email notifications.
Run with: python -m app.workers.notification_worker

This worker:
1. Sends reminders for action items due soon or overdue
2. Can be extended to send weekly digests
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import List

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.db.models.action_item import ActionItem
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.services.email_notifier import (
    send_action_item_reminder,
    send_weekly_digest,
    is_email_configured,
)


def send_due_date_reminders(db) -> int:
    """Send reminders for action items due within 3 days or overdue."""
    now = datetime.now(timezone.utc)
    three_days_from_now = now + timedelta(days=3)
    
    # Find open action items with due dates that are upcoming or overdue
    items = (
        db.query(ActionItem)
        .filter(ActionItem.status == "open")
        .filter(ActionItem.due_date.isnot(None))
        .filter(ActionItem.due_date <= three_days_from_now)
        .filter(ActionItem.owner_id.isnot(None))
        .all()
    )
    
    sent_count = 0
    for item in items:
        owner = db.query(User).filter(User.id == item.owner_id).first()
        meeting = db.query(Meeting).filter(Meeting.id == item.meeting_id).first()
        
        if not owner or not meeting:
            continue
        
        # Calculate days until due
        due_date = item.due_date
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)
        
        days_until_due = (due_date.date() - now.date()).days
        
        # Only send if due today, tomorrow, or overdue (skip if 2-3 days out for now)
        if days_until_due <= 1:
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
    
    return sent_count


def send_weekly_digests(db) -> int:
    """Send weekly digest to all users with open action items."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    
    # Get all users
    users = db.query(User).all()
    sent_count = 0
    
    for user in users:
        # Get open action items for this user
        open_items = (
            db.query(ActionItem)
            .filter(ActionItem.owner_id == user.id)
            .filter(ActionItem.status == "open")
            .all()
        )
        
        if not open_items:
            continue
        
        # Count overdue items
        overdue_count = sum(
            1 for item in open_items
            if item.due_date and item.due_date < now
        )
        
        # Count meetings this week
        meetings_this_week = (
            db.query(Meeting)
            .filter(Meeting.created_at >= week_ago)
            .count()
        )
        
        # Build action items list
        action_items_list = [
            {"description": item.description}
            for item in open_items
        ]
        
        success = send_weekly_digest(
            to_email=user.email,
            to_name=user.name,
            open_actions=len(open_items),
            overdue_actions=overdue_count,
            meetings_this_week=meetings_this_week,
            action_items_list=action_items_list,
        )
        if success:
            sent_count += 1
    
    return sent_count


def run_notifications():
    """Run all notification jobs."""
    print("=" * 50)
    print(f"🔔 Running notification worker at {datetime.now()}")
    print("=" * 50)
    
    if not is_email_configured():
        print("⚠️  Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.")
        print("    Notifications will be logged but not sent.")
    
    db = SessionLocal()
    try:
        # Send due date reminders
        print("\n📧 Sending due date reminders...")
        reminder_count = send_due_date_reminders(db)
        print(f"   Sent {reminder_count} reminder(s)")
        
        # Check if it's Monday for weekly digest (or force with env var)
        is_monday = datetime.now().weekday() == 0
        force_digest = os.getenv("FORCE_WEEKLY_DIGEST", "").lower() == "true"
        
        if is_monday or force_digest:
            print("\n📊 Sending weekly digests...")
            digest_count = send_weekly_digests(db)
            print(f"   Sent {digest_count} digest(s)")
        else:
            print("\n📊 Skipping weekly digests (only sent on Mondays)")
        
        print("\n✅ Notification worker complete!")
        
    finally:
        db.close()


if __name__ == "__main__":
    run_notifications()