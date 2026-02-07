import os
import requests

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

def send_slack_message(text: str) -> None:
    if not SLACK_WEBHOOK_URL:
        print("⚠️ Slack webhook not configured (SLACK_WEBHOOK_URL missing)")
        return

    payload = {"text": text}

    try:
        resp = requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=5)
        if resp.status_code >= 400:
            print("⚠️ Slack error:", resp.status_code, resp.text)
    except Exception as e:
        print("⚠️ Slack exception:", e)