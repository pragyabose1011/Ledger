print("🔥 RUNNING UPDATED extract_from_transcript.py 🔥")

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
    # 3. SAVE DECISIONS
    # -----------------------------
    for d in result.get("decisions", []):
        if isinstance(d, dict):
            summary = d.get("summary") or d.get("text")
        else:
            summary = str(d)

        db.add(
            Decision(
                meeting_id=transcript.meeting_id,
                summary=summary,
            )
        )

    # -----------------------------
    # 4. SAVE ACTION ITEMS (FIXED)
    # -----------------------------
    

    for a in result["action_items"]:
        owner_id = None

        if a.get("owner"):
            user = db.query(User).filter(User.name == a["owner"]).first()
            if not user:
                user = User(name=a["owner"])
                db.add(user)
                db.flush()  # get user.id without commit

            owner_id = user.id

        db.add(
            ActionItem(
                meeting_id=transcript.meeting_id,
                description=a["description"],
                status="open",
                owner_id=owner_id,
                source_sentence=a.get("source_sentence"),
            )
        )



    # -----------------------------
    # 5. COMMIT
    # -----------------------------
    db.commit()
