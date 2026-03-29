from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.colleague import Colleague
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/colleagues", tags=["colleagues"])


class AddColleagueRequest(BaseModel):
    email: str


@router.get("/")
def list_colleagues(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Colleague, User)
        .join(User, Colleague.colleague_id == User.id)
        .filter(Colleague.user_id == current_user.id)
        .all()
    )
    return [
        {
            "id": c.id,
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "avatar_url": u.avatar_url,
        }
        for c, u in rows
    ]


@router.post("/")
def add_colleague(
    payload: AddColleagueRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    if email == current_user.email.lower():
        raise HTTPException(400, "You cannot add yourself as a colleague")

    colleague_user = db.query(User).filter(User.email == email).first()
    if not colleague_user:
        raise HTTPException(404, "No user found with that email address")

    existing = db.query(Colleague).filter(
        Colleague.user_id == current_user.id,
        Colleague.colleague_id == colleague_user.id,
    ).first()
    if existing:
        raise HTTPException(400, "Already connected with this colleague")

    c = Colleague(user_id=current_user.id, colleague_id=colleague_user.id)
    db.add(c)
    db.commit()
    db.refresh(c)

    return {
        "id": c.id,
        "user_id": colleague_user.id,
        "name": colleague_user.name,
        "email": colleague_user.email,
        "role": colleague_user.role,
        "avatar_url": colleague_user.avatar_url,
    }


@router.delete("/{colleague_id}")
def remove_colleague(
    colleague_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(Colleague).filter(
        Colleague.id == colleague_id,
        Colleague.user_id == current_user.id,
    ).first()
    if not c:
        raise HTTPException(404, "Colleague not found")
    db.delete(c)
    db.commit()
    return {"message": "Colleague removed"}
