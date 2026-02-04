from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.transcript import Transcript
from app.workers.extract_from_transcript import process_transcript
from app.services.openai_client import get_llm

router = APIRouter(prefix="/extract", tags=["ai"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def extract(transcript_id: str, db: Session = Depends(get_db)):
    transcript = db.query(Transcript).get(transcript_id)
    process_transcript(db, get_llm(), transcript)
    return {"status": "extracted"}
