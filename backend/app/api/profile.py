import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.api.auth import get_current_user, verify_password, get_password_hash, validate_password

router = APIRouter(prefix="/profile", tags=["profile"])

UPLOADS_DIR = "uploads/avatars"
os.makedirs(UPLOADS_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


class UpdateProfileRequest(BaseModel):
    name: str
    role: str = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @validator("new_password")
    def check_password(cls, v):
        return validate_password(v)


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "created_at": str(current_user.created_at),
        "stripe_subscription_id": current_user.stripe_subscription_id,
    }


@router.put("/me")
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = payload.name.strip()
    current_user.role = payload.role.strip() if payload.role else None
    db.commit()
    return {"message": "Profile updated"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, GIF, and WebP images are allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File size exceeds 5 MB limit")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # Remove old avatar file if it exists
    if current_user.avatar_url:
        old_path = current_user.avatar_url.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    return {"avatar_url": current_user.avatar_url}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.password_hash is None:
        raise HTTPException(400, "Your account uses OAuth login — password cannot be changed here.")
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
