from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.user import User
from app.db.models.meeting_participant import MeetingParticipant

router = APIRouter(prefix="/meetings", tags=["meetings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_meeting(payload: dict, db: Session = Depends(get_db)):
    meeting = Meeting(
        title=payload["title"],
        platform=payload.get("platform")
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    for p in payload.get("participants", []):
        user = db.query(User).filter(User.email == p["email"]).first()
        if not user:
            user = User(
                name=p["name"],
                email=p["email"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        link = MeetingParticipant(
            meeting_id=meeting.id,
            user_id=user.id,
            role=p.get("role")
        )
        db.add(link)

    db.commit()

    return {"meeting_id": meeting.id}
