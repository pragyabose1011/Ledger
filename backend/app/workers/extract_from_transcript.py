from app.services.ai_extractor import extract_decisions_and_actions
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem

def process_transcript(db, llm, transcript):
    result = extract_decisions_and_actions(llm, transcript.content)

    for d in result.get("decisions", []):
        db.add(Decision(
            meeting_id=transcript.meeting_id,
            summary=d["summary"]
        ))

    for a in result.get("action_items", []):
        db.add(ActionItem(
            meeting_id=transcript.meeting_id,
            description=a["description"]
        ))

    db.commit()
