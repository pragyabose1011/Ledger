from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.transcript import Transcript

router = APIRouter(prefix="/transcripts", tags=["transcripts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def upload_transcript(payload: dict, db: Session = Depends(get_db)):
    transcript = Transcript(
        meeting_id=payload["meeting_id"],
        content=payload["content"]
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    return {"transcript_id": transcript.id}
