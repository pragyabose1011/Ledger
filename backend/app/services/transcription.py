"""
Audio/Video transcription service using OpenAI Whisper.
"""
import os
import tempfile
from pathlib import Path
from typing import Optional
import httpx

# For local whisper fallback
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")


def transcribe_with_openai(file_path: str) -> Optional[str]:
    """Transcribe audio using OpenAI Whisper API."""
    from openai import OpenAI
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️ No OpenAI API key found")
        return None
    
    try:
        client = OpenAI(api_key=api_key)
        
        with open(file_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text",
            )
        
        return response
    except Exception as e:
        print(f"⚠️ OpenAI Whisper error: {e}")
        return None


def transcribe_with_local_whisper(file_path: str) -> Optional[str]:
    """
    Transcribe using local Whisper model.
    Requires: pip install openai-whisper
    """
    try:
        import whisper
        
        model = whisper.load_model("base")  # Options: tiny, base, small, medium, large
        result = model.transcribe(file_path)
        return result["text"]
    except ImportError:
        print("⚠️ Local whisper not installed. Run: pip install openai-whisper")
        return None
    except Exception as e:
        print(f"⚠️ Local Whisper error: {e}")
        return None


def format_transcript_with_timestamps(segments: list) -> str:
    """Format transcript with timestamps."""
    lines = []
    for segment in segments:
        start = segment.get("start", 0)
        text = segment.get("text", "").strip()
        
        # Convert seconds to MM:SS format
        minutes = int(start // 60)
        seconds = int(start % 60)
        timestamp = f"[{minutes:02d}:{seconds:02d}]"
        
        lines.append(f"{timestamp} {text}")
    
    return "\n".join(lines)


def transcribe_audio(file_path: str, use_local: bool = False) -> Optional[str]:
    """
    Main transcription function.
    Tries OpenAI first, falls back to local Whisper if configured.
    """
    print(f"🎤 Transcribing: {file_path}")
    
    if use_local:
        result = transcribe_with_local_whisper(file_path)
        if result:
            print("✅ Local Whisper transcription successful")
            return result
    
    # Try OpenAI
    result = transcribe_with_openai(file_path)
    if result:
        print("✅ OpenAI Whisper transcription successful")
        return result
    
    # Fallback to local
    print("🔄 Trying local Whisper fallback...")
    result = transcribe_with_local_whisper(file_path)
    if result:
        print("✅ Local Whisper transcription successful")
        return result
    
    print("❌ All transcription methods failed")
    return None


ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm", ".ogg"}
MAX_FILE_SIZE_MB = 25  # OpenAI Whisper limit


def validate_audio_file(filename: str, file_size: int) -> tuple[bool, str]:
    """Validate uploaded audio file."""
    ext = Path(filename).suffix.lower()
    
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        return False, f"Invalid file type. Allowed: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
    
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
    
    return True, "OK"