from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.decision import Decision

router = APIRouter(prefix="/decisions", tags=["decisions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_decision(payload: dict, db: Session = Depends(get_db)):
    decision = Decision(
        meeting_id=payload["meeting_id"],
        summary=payload["summary"]
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    return {"decision_id": decision.id}
