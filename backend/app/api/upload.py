"""
File upload endpoints for audio/video transcription.
"""
import os
import tempfile
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.transcript import Transcript
from app.db.models.user import User
from app.api.auth import get_current_user
from app.services.transcription import (
    transcribe_audio,
    validate_audio_file,
    ALLOWED_AUDIO_EXTENSIONS,
)

router = APIRouter(prefix="/upload", tags=["upload"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    meeting_id: str = Form(...),
    use_local_whisper: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an audio/video file and transcribe it.
    
    Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
    Max file size: 25MB
    """
    # Validate meeting exists and belongs to user
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file
    is_valid, message = validate_audio_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Save to temporary file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Transcribe
        transcript_text = transcribe_audio(tmp_path, use_local=use_local_whisper)
        
        if not transcript_text:
            raise HTTPException(
                status_code=503,
                detail="Transcription failed. Check your OpenAI API key or install local Whisper."
            )
        
        # Check if transcript already exists for this meeting
        existing = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
        if existing:
            # Update existing transcript
            existing.content = transcript_text
            db.commit()
            transcript_id = existing.id
        else:
            # Create new transcript
            transcript = Transcript(
                meeting_id=meeting_id,
                content=transcript_text,
            )
            db.add(transcript)
            db.commit()
            db.refresh(transcript)
            transcript_id = transcript.id
        
        return {
            "message": "Transcription successful",
            "transcript_id": transcript_id,
            "transcript_preview": transcript_text[:500] + "..." if len(transcript_text) > 500 else transcript_text,
            "character_count": len(transcript_text),
        }
    
    finally:
        # Clean up temp file
        os.unlink(tmp_path)


@router.get("/formats")
def get_supported_formats():
    """Get list of supported audio/video formats."""
    return {
        "formats": list(ALLOWED_AUDIO_EXTENSIONS),
        "max_size_mb": 25,
    }