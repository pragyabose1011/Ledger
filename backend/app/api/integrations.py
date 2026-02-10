"""
Third-party integration endpoints (Zoom, Teams, etc.)
"""
import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.transcript import Transcript
from app.db.models.user import User
from app.api.auth import get_current_user
from app.services.zoom import (
    get_zoom_access_token,
    get_user_access_token,
    list_recordings,
    get_recording_transcript,
    download_recording,
    ZOOM_CLIENT_ID,
)
from app.services.transcription import transcribe_audio

router = APIRouter(prefix="/integrations", tags=["integrations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- Zoom --------------------

@router.get("/zoom/status")
def zoom_status():
    """Check if Zoom integration is configured."""
    return {
        "configured": bool(ZOOM_CLIENT_ID),
        "auth_url": f"https://zoom.us/oauth/authorize?response_type=code&client_id={ZOOM_CLIENT_ID}&redirect_uri=http://localhost:5173/oauth/callback" if ZOOM_CLIENT_ID else None,
    }


@router.get("/zoom/recordings")
def get_zoom_recordings(
    access_token: str = Query(..., description="Zoom access token"),
    days: int = Query(30, description="Number of days to look back"),
    current_user: User = Depends(get_current_user),
):
    """List available Zoom cloud recordings."""
    recordings = list_recordings(access_token, days=days)
    return {"recordings": recordings}


@router.post("/zoom/import")
def import_zoom_recording(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import a Zoom recording into Ledger.
    
    Expected payload:
    {
        "access_token": "...",
        "meeting_uuid": "...",
        "topic": "...",
        "download_url": "...",  # Optional - for audio
        "file_type": "TRANSCRIPT" or "MP4" or "M4A"
    }
    """
    access_token = payload.get("access_token")
    meeting_uuid = payload.get("meeting_uuid")
    topic = payload.get("topic", "Zoom Meeting")
    download_url = payload.get("download_url")
    file_type = payload.get("file_type", "TRANSCRIPT")
    
    if not access_token or not meeting_uuid:
        raise HTTPException(status_code=400, detail="Missing access_token or meeting_uuid")
    
    # Create meeting in Ledger
    meeting = Meeting(
        title=topic,
        platform="Zoom",
        owner_id=current_user.id,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    transcript_text = None
    
    # Try to get transcript
    if file_type == "TRANSCRIPT":
        transcript_text = get_recording_transcript(access_token, meeting_uuid)
    
    # If no transcript but we have audio, transcribe it
    if not transcript_text and download_url and file_type in ["MP4", "M4A"]:
        audio_data = download_recording(access_token, download_url)
        
        if audio_data:
            # Save to temp file and transcribe
            suffix = ".mp4" if file_type == "MP4" else ".m4a"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            
            try:
                transcript_text = transcribe_audio(tmp_path)
            finally:
                os.unlink(tmp_path)
    
    if transcript_text:
        transcript = Transcript(
            meeting_id=meeting.id,
            content=transcript_text,
        )
        db.add(transcript)
        db.commit()
        
        return {
            "message": "Meeting imported successfully",
            "meeting_id": meeting.id,
            "has_transcript": True,
        }
    else:
        return {
            "message": "Meeting created but no transcript available",
            "meeting_id": meeting.id,
            "has_transcript": False,
        }


# -------------------- Microsoft Teams --------------------

TEAMS_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")

@router.get("/teams/status")
def teams_status():
    """Check if Microsoft Teams integration is configured."""
    return {
        "configured": bool(TEAMS_CLIENT_ID),
        "auth_url": f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={TEAMS_CLIENT_ID}&response_type=code&redirect_uri=http://localhost:5173/oauth/callback&scope=OnlineMeetings.Read" if TEAMS_CLIENT_ID else None,
    }


# -------------------- Google Meet --------------------

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

@router.get("/meet/status")
def meet_status():
    """Check if Google Meet integration is configured."""
    return {
        "configured": bool(GOOGLE_CLIENT_ID),
        "auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:5173/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly" if GOOGLE_CLIENT_ID else None,
    }