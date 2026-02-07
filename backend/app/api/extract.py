from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.transcript import Transcript
from app.workers.extract_from_transcript import process_transcript
from app.services.openai_client import get_llm
from app.api.schemas import ExtractRequest

router = APIRouter(prefix="/extract", tags=["ai"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def extract(payload: ExtractRequest, db: Session = Depends(get_db)):
    transcript = db.query(Transcript).get(payload.transcript_id)

    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    try:
        llm = get_llm()
    except Exception as e:
        # Provide a clear 503 when the LLM client can't be initialized
        raise HTTPException(status_code=503, detail=str(e))

    try:
        process_transcript(db, llm, transcript)

    except Exception as e:
        # Log and return the error so caller can see why extraction failed
        import traceback
        tb = traceback.format_exc()
        # Optionally write to server logs
        print("Error during extract:", tb)
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "extracted"}
