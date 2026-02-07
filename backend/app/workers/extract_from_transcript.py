print("🔥 RUNNING UPDATED extract_from_transcript.py 🔥")

from datetime import datetime
from app.services.ai_extractor import extract_decisions_and_actions
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.user import User

def process_transcript(db, llm, transcript):
    # -----------------------------
    # 1. DELETE OLD DATA (IDEMPOTENT)
    # -----------------------------
    db.query(Decision).filter(
        Decision.meeting_id == transcript.meeting_id
    ).delete()

    db.query(ActionItem).filter(
        ActionItem.meeting_id == transcript.meeting_id
    ).delete()

    db.commit()

    # -----------------------------
    # 2. RUN EXTRACTION
    # -----------------------------
    result = extract_decisions_and_actions(
        llm, transcript.content
    )

        # -----------------------------
    # 3. SAVE DECISIONS (with confidence)
    # -----------------------------
    for d in result.get("decisions", []):
        if isinstance(d, dict):
            summary = d.get("summary") or d.get("text") or ""
            source_sentence = d.get("source_sentence")
            confidence = d.get("confidence")
        else:
            summary = str(d)
            source_sentence = None
            confidence = None

        db.add(
            Decision(
                meeting_id=transcript.meeting_id,
                summary=summary,
                source_sentence=source_sentence,
                confidence=confidence,
            )
        )
    
    # -----------------------------
    # 4. SAVE ACTION ITEMS (FIXED)
    # -----------------------------
    for a in result.get("action_items", []):
        # Resolve owner_name → User → owner_id
        owner_name = a.get("owner")
        owner_id = None
        if owner_name:
            owner = (
                db.query(User)
                .filter(User.name == owner_name)
                .first()
            )

            if not owner:
                owner = User(name=owner_name)
                db.add(owner)
                db.commit()
                db.refresh(owner)

            owner_id = owner.id

        # Parse due_date from ISO string, if present
        due = None
        if a.get("due_date"):
            try:
                due = datetime.fromisoformat(a["due_date"])
            except Exception:
                pass  # ignore malformed dates

        db.add(
            ActionItem(
                meeting_id=transcript.meeting_id,
                description=a["description"],
                status="open",
                owner_id=owner_id,
                due_date=due,
                source_sentence=a.get("source_sentence"),
                confidence=a.get("confidence"),
            )
        )


    from app.workers.alert_engine import run_alerts_for_meeting

    run_alerts_for_meeting(db, transcript.meeting_id)


    # -----------------------------
    # 5. COMMIT
    # -----------------------------
    db.commit()
