from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.alert import Alert

router = APIRouter(prefix="/alerts", tags=["alerts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{meeting_id}")
def get_alerts(meeting_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Alert)
        .filter(Alert.meeting_id == meeting_id)
        .order_by(Alert.created_at.desc())
        .all()
    )
