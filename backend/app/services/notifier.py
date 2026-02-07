from typing import Optional

from app.services.slack_notifier import send_slack_message
from app.services.email_notifier import send_email
from app.db.models.alert import Alert

def notify(alert: Alert, email: Optional[str] = None) -> None:
    # Always try Slack
    send_slack_message(f"*Meeting Alert*\n{alert.message}")

    # Optional email
    if email:
        send_email(
            to=email,
            subject="Meeting Alert",
            body=alert.message,
        )