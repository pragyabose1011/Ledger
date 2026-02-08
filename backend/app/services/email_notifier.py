import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Ledger")


def is_email_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS)


def send_email(to: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Send an email. Returns True if sent, False otherwise."""
    if not is_email_configured():
        print(f"⚠️ Email not configured (SMTP_* env vars missing). Would have sent to {to}: {subject}")
        return False

    try:
        if html_body:
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(body, "plain"))
            msg.attach(MIMEText(html_body, "html"))
        else:
            msg = MIMEText(body)

        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
        msg["To"] = to

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email sent to {to}: {subject}")
        return True
    except Exception as e:
        print(f"⚠️ Email exception: {e}")
        return False


def send_action_item_assigned(
    to_email: str,
    to_name: str,
    action_description: str,
    meeting_title: str,
    due_date: Optional[str] = None,
) -> bool:
    """Send notification when an action item is assigned to someone."""
    subject = f"[Ledger] New action item assigned: {action_description[:50]}..."
    
    due_text = f"\n\nDue Date: {due_date}" if due_date else ""
    
    body = f"""Hi {to_name},

You've been assigned a new action item from the meeting "{meeting_title}":

"{action_description}"{due_text}

Log in to Ledger to acknowledge this item and track your progress.

— Ledger
"""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; }}
        .logo {{ color: #f472b6; font-size: 24px; font-weight: bold; margin-bottom: 24px; }}
        .action-box {{ background: #334155; border-left: 4px solid #f472b6; padding: 16px; border-radius: 8px; margin: 16px 0; }}
        .meeting {{ color: #94a3b8; font-size: 14px; }}
        .due {{ color: #fbbf24; font-size: 14px; margin-top: 12px; }}
        .button {{ display: inline-block; background: #f472b6; color: #0f172a; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }}
        .footer {{ color: #64748b; font-size: 12px; margin-top: 32px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">◉ Ledger</div>
        <p>Hi {to_name},</p>
        <p>You've been assigned a new action item:</p>
        <div class="action-box">
            <strong>{action_description}</strong>
            <div class="meeting">From: {meeting_title}</div>
            {"<div class='due'>📅 Due: " + due_date + "</div>" if due_date else ""}
        </div>
        <a href="#" class="button">View in Ledger</a>
        <div class="footer">— The Ledger Team</div>
    </div>
</body>
</html>
"""
    return send_email(to_email, subject, body, html_body)


def send_action_item_reminder(
    to_email: str,
    to_name: str,
    action_description: str,
    meeting_title: str,
    due_date: str,
    days_until_due: int,
) -> bool:
    """Send reminder for upcoming action item deadline."""
    if days_until_due == 0:
        urgency = "due TODAY"
        subject = f"[Ledger] ⚠️ Action item due TODAY: {action_description[:40]}..."
    elif days_until_due < 0:
        urgency = f"OVERDUE by {abs(days_until_due)} day(s)"
        subject = f"[Ledger] 🚨 OVERDUE action item: {action_description[:40]}..."
    else:
        urgency = f"due in {days_until_due} day(s)"
        subject = f"[Ledger] Reminder: Action item {urgency}"

    body = f"""Hi {to_name},

This is a reminder about your action item that is {urgency}:

"{action_description}"

From meeting: {meeting_title}
Due: {due_date}

Please log in to Ledger to update the status of this item.

— Ledger
"""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; }}
        .logo {{ color: #f472b6; font-size: 24px; font-weight: bold; margin-bottom: 24px; }}
        .urgent {{ background: {"#7f1d1d" if days_until_due <= 0 else "#78350f"}; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 16px; }}
        .action-box {{ background: #334155; border-left: 4px solid {"#ef4444" if days_until_due <= 0 else "#fbbf24"}; padding: 16px; border-radius: 8px; margin: 16px 0; }}
        .meeting {{ color: #94a3b8; font-size: 14px; }}
        .due {{ color: {"#fca5a5" if days_until_due <= 0 else "#fbbf24"}; font-size: 14px; margin-top: 12px; font-weight: bold; }}
        .button {{ display: inline-block; background: #f472b6; color: #0f172a; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }}
        .footer {{ color: #64748b; font-size: 12px; margin-top: 32px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">◉ Ledger</div>
        <div class="urgent">
            <strong>{"🚨 " if days_until_due <= 0 else "⏰ "}{urgency.upper()}</strong>
        </div>
        <p>Hi {to_name},</p>
        <p>This is a reminder about your action item:</p>
        <div class="action-box">
            <strong>{action_description}</strong>
            <div class="meeting">From: {meeting_title}</div>
            <div class="due">📅 Due: {due_date}</div>
        </div>
        <a href="#" class="button">Update Status</a>
        <div class="footer">— The Ledger Team</div>
    </div>
</body>
</html>
"""
    return send_email(to_email, subject, body, html_body)


def send_weekly_digest(
    to_email: str,
    to_name: str,
    open_actions: int,
    overdue_actions: int,
    meetings_this_week: int,
    action_items_list: List[dict],
) -> bool:
    """Send weekly digest of open action items."""
    subject = f"[Ledger] Your weekly digest: {open_actions} open action items"

    action_list_text = "\n".join([f"  • {a['description']}" for a in action_items_list[:10]])
    if len(action_items_list) > 10:
        action_list_text += f"\n  ... and {len(action_items_list) - 10} more"

    body = f"""Hi {to_name},

Here's your weekly Ledger digest:

📊 This Week's Stats:
  • Meetings: {meetings_this_week}
  • Open Action Items: {open_actions}
  • Overdue Items: {overdue_actions}

📋 Your Open Action Items:
{action_list_text}

Log in to Ledger to stay on top of your tasks.

— Ledger
"""

    action_html = "".join([
        f'<div style="padding: 8px 0; border-bottom: 1px solid #334155;">{a["description"]}</div>'
        for a in action_items_list[:10]
    ])

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; }}
        .logo {{ color: #f472b6; font-size: 24px; font-weight: bold; margin-bottom: 24px; }}
        .stats {{ display: flex; gap: 16px; margin: 24px 0; }}
        .stat {{ flex: 1; background: #334155; border-radius: 12px; padding: 16px; text-align: center; }}
        .stat-value {{ font-size: 28px; font-weight: bold; color: #f472b6; }}
        .stat-label {{ font-size: 12px; color: #94a3b8; margin-top: 4px; }}
        .overdue {{ color: #ef4444 !important; }}
        .actions {{ background: #334155; border-radius: 12px; padding: 16px; margin: 16px 0; }}
        .button {{ display: inline-block; background: #f472b6; color: #0f172a; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }}
        .footer {{ color: #64748b; font-size: 12px; margin-top: 32px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">◉ Ledger</div>
        <h2 style="margin: 0;">Weekly Digest</h2>
        <p style="color: #94a3b8;">Hi {to_name}, here's what happened this week.</p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">{meetings_this_week}</div>
                <div class="stat-label">Meetings</div>
            </div>
            <div class="stat">
                <div class="stat-value">{open_actions}</div>
                <div class="stat-label">Open Items</div>
            </div>
            <div class="stat">
                <div class="stat-value {'overdue' if overdue_actions > 0 else ''}">{overdue_actions}</div>
                <div class="stat-label">Overdue</div>
            </div>
        </div>
        
        <h3>Your Open Action Items</h3>
        <div class="actions">
            {action_html}
            {"<div style='padding: 8px 0; color: #94a3b8;'>... and " + str(len(action_items_list) - 10) + " more</div>" if len(action_items_list) > 10 else ""}
        </div>
        
        <a href="#" class="button">View Dashboard</a>
        <div class="footer">— The Ledger Team</div>
    </div>
</body>
</html>
"""
    return send_email(to_email, subject, body, html_body)


def send_meeting_summary(
    to_email: str,
    to_name: str,
    meeting_title: str,
    decisions_count: int,
    action_items_count: int,
    risks_count: int,
    decisions: List[str],
    action_items: List[dict],
) -> bool:
    """Send meeting summary after extraction completes."""
    subject = f"[Ledger] Meeting summary: {meeting_title}"

    decisions_text = "\n".join([f"  ✓ {d}" for d in decisions]) or "  (none)"
    actions_text = "\n".join([f"  • {a['description']} ({a.get('owner', 'unassigned')})" for a in action_items]) or "  (none)"

    body = f"""Hi {to_name},

Here's the summary from "{meeting_title}":

📊 Overview:
  • Decisions: {decisions_count}
  • Action Items: {action_items_count}
  • Risks Identified: {risks_count}

✅ Decisions:
{decisions_text}

📋 Action Items:
{actions_text}

View the full meeting details in Ledger.

— Ledger
"""
    return send_email(to_email, subject, body)