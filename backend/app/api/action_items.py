from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.action_item import ActionItem
from app.api.auth import get_current_user
from app.db.models.user import User

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
        due_date=payload.get("due_date"),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"action_item_id": item.id}


@router.post("/{action_item_id}/acknowledge")
def acknowledge_action_item(
    action_item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ActionItem).get(action_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    if item.status == "done":
        # Already completed; nothing to do
        return {"status": "already_done"}

    item.acknowledged_at = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"status": "acknowledged", "action_item_id": item.id}