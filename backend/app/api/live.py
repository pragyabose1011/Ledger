"""Live meeting assist — real-time AI suggestions during recording."""
import json
import os

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/live", tags=["live"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_OLLAMA = os.getenv("USE_OLLAMA", "false").lower() == "true"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

_EMPTY = {"summary": "", "questions": [], "action_items": [], "decisions": []}


class LiveAssistRequest(BaseModel):
    transcript: str
    meeting_title: str = ""


@router.post("/assist")
async def live_assist(
    payload: LiveAssistRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze partial transcript and return real-time meeting insights."""
    text = payload.transcript.strip()
    if len(text) < 40:
        return _EMPTY

    prompt = (
        f'You are a real-time meeting assistant analyzing a meeting called "{payload.meeting_title}".\n\n'
        f"TRANSCRIPT SO FAR (last 2000 chars):\n{text[-2000:]}\n\n"
        "Return ONLY valid JSON — no markdown fences, no extra text:\n"
        '{"summary":"2-sentence summary","questions":["q1","q2"],'
        '"action_items":["item1","item2"],"decisions":["decision1"]}'
    )

    try:
        result = await _call_llm(prompt)
        return result
    except Exception:
        return _EMPTY


async def _call_llm(prompt: str) -> dict:
    if OPENAI_API_KEY:
        import openai
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400,
        )
        text = resp.choices[0].message.content.strip()
    elif USE_OLLAMA:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
                timeout=30.0,
            )
            r.raise_for_status()
            text = r.json().get("response", "")
    else:
        raise RuntimeError("No LLM configured")

    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        return json.loads(text[start:end])
    raise RuntimeError("Could not parse LLM JSON response")
