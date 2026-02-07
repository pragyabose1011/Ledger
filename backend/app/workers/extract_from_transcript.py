# /Users/pragyabose/Ledger/backend/app/workers/extract_from_transcript.py
print("🔥 RUNNING UPDATED extract_from_transcript.py 🔥")

from datetime import datetime
from app.services.ai_extractor import extract_decisions_and_actions
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.user import User
from app.db.models.risk import Risk

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

    db.query(Risk).filter(
        Risk.meeting_id == transcript.meeting_id
    ).delete()

    db.commit()

    # -----------------------------
    # 2. RUN EXTRACTION
    # -----------------------------
    result = extract_decisions_and_actions(
        llm, transcript.content
    )

    # -----------------------------
    # 3. SAVE DECISIONS (with owner + confidence)
    # -----------------------------
    for d in result.get("decisions", []):
        if isinstance(d, dict):
            summary = d.get("summary") or d.get("text") or ""
            source_sentence = d.get("source_sentence")
            confidence = d.get("confidence")
            owner_name = d.get("owner")
        else:
            summary = str(d)
            source_sentence = None
            confidence = None
            owner_name = None

        owner_id = None
        if owner_name:
            owner = db.query(User).filter(User.name == owner_name).first()
            if not owner:
                owner = User(name=owner_name, email=f"{owner_name.lower().replace(' ', '.')}@example.com")
                db.add(owner)
                db.commit()
                db.refresh(owner)
            owner_id = owner.id

        db.add(
            Decision(
                meeting_id=transcript.meeting_id,
                summary=summary,
                source_sentence=source_sentence,
                confidence=confidence,
                owner_id=owner_id,
            )
        )
    
    # -----------------------------
    # 4. SAVE ACTION ITEMS
    # -----------------------------
    for a in result.get("action_items", []):
        owner_name = a.get("owner")
        owner_id = None
        if owner_name:
            owner = db.query(User).filter(User.name == owner_name).first()
            if not owner:
                owner = User(name=owner_name, email=f"{owner_name.lower().replace(' ', '.')}@example.com")
                db.add(owner)
                db.commit()
                db.refresh(owner)
            owner_id = owner.id

        due = None
        if a.get("due_date"):
            try:
                due = datetime.fromisoformat(a["due_date"])
            except Exception:
                pass

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

    # -----------------------------
    # 5. SAVE RISKS
    # -----------------------------
    for r in result.get("risks", []):
        if isinstance(r, dict):
            description = r.get("description") or ""
            source_sentence = r.get("source_sentence")
            confidence = r.get("confidence")
        else:
            description = str(r)
            source_sentence = None
            confidence = None

        db.add(
            Risk(
                meeting_id=transcript.meeting_id,
                description=description,
                source_sentence=source_sentence,
                confidence=confidence,
            )
        )

    db.commit()

    # -----------------------------
    # 6. RUN ALERTS (single + repeated)
    # -----------------------------
    from app.workers.alert_engine import run_alerts_for_meeting, detect_repeated_issues
    run_alerts_for_meeting(db, transcript.meeting_id)
    detect_repeated_issues(db, transcript.meeting_id)