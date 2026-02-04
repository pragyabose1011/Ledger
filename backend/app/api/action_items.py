from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.action_item import ActionItem

router = APIRouter(prefix="/action-items", tags=["action-items"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_action_item(payload: dict, db: Session = Depends(get_db)):
    item = ActionItem(
        meeting_id=payload["meeting_id"],
        owner_id=payload.get("owner_id"),
        description=payload["description"],
        due_date=payload.get("due_date")
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"action_item_id": item.id}
