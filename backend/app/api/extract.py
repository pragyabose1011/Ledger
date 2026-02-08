from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.transcript import Transcript
from app.db.models.meeting import Meeting
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.risk import Risk
from app.db.models.user import User
from app.workers.extract_from_transcript import process_transcript
from app.services.openai_client import get_llm
from app.services.email_notifier import send_meeting_summary, send_action_item_assigned
from app.api.schemas import ExtractRequest

router = APIRouter(prefix="/extract", tags=["ai"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def send_post_extraction_notifications(db: Session, meeting_id: str):
    """Send email notifications after extraction completes."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        return

    action_items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()

    for item in action_items:
        if item.owner_id:
            owner = db.query(User).filter(User.id == item.owner_id).first()
            if owner:
                due_date_str = item.due_date.strftime("%Y-%m-%d") if item.due_date else None
                send_action_item_assigned(
                    to_email=owner.email,
                    to_name=owner.name,
                    action_description=item.description,
                    meeting_title=meeting.title,
                    due_date=due_date_str,
                )


def index_meeting_for_rag(db: Session, meeting_id: str):
    """Index meeting transcript for RAG after extraction."""
    try:
        from app.services.rag import index_meeting
        
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return
        
        transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
        if not transcript:
            return
        
        index_meeting(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            transcript=transcript.content,
            user_id=meeting.owner_id,
            meeting_date=meeting.created_at,
        )
        print(f"✅ Auto-indexed meeting for RAG: {meeting.title}")
    except Exception as e:
        print(f"⚠️ RAG indexing failed (non-fatal): {e}")


@router.post("/")
def extract(payload: ExtractRequest, db: Session = Depends(get_db)):
    transcript = db.query(Transcript).get(payload.transcript_id)

    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    try:
        llm = get_llm()
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        process_transcript(db, llm, transcript)
        
        # Send email notifications after successful extraction
        try:
            send_post_extraction_notifications(db, transcript.meeting_id)
        except Exception as notify_err:
            print(f"⚠️ Notification error (non-fatal): {notify_err}")
        
        # Index for RAG after successful extraction
        try:
            index_meeting_for_rag(db, transcript.meeting_id)
        except Exception as rag_err:
            print(f"⚠️ RAG indexing error (non-fatal): {rag_err}")

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print("Error during extract:", tb)
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "extracted"}