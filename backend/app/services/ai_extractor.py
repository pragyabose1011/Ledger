import json
import os
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
USE_OLLAMA = os.getenv("USE_OLLAMA", "false").lower() == "true"

SYSTEM_PROMPT = """
You are an assistant that extracts structured information from meeting transcripts.

Return STRICT JSON with this schema:
{
  "decisions": [
    {
      "summary": "string",
      "owner": "string | null",
      "source_sentence": "string | null",
      "confidence": 0.0
    }
  ],
  "action_items": [
    {
      "description": "string",
      "owner": "string | null",
      "due_date": "string | null",
      "source_sentence": "string | null",
      "confidence": 0.0
    }
  ],
  "risks": [
    {
      "description": "string",
      "source_sentence": "string | null",
      "confidence": 0.0
    }
  ]
}

Rules for confidence:
- confidence is between 0 and 1
- higher when the statement is clear, explicit, and committed
- lower when it's vague, tentative, or hypothetical

Rules for owner:
- Extract the person's name if explicitly mentioned
- Use null if no clear owner is stated

IMPORTANT: Return ONLY valid JSON, no other text.
"""


def extract_with_ollama(transcript_text: str, model: str = None) -> dict:
    """Extract decisions, action items, and risks using local Ollama model."""
    if model is None:
        model = OLLAMA_MODEL

    prompt = f"""{SYSTEM_PROMPT}

Meeting Transcript:
---
{transcript_text}
---

Extract decisions, action items, and risks from the transcript above. Return ONLY valid JSON:"""

    try:
        logger.info(f"🦙 Sending transcript to Ollama ({model})...")
        logger.info(f"Transcript preview: {transcript_text[:200]}...")

        with httpx.Client(timeout=120) as client:
            response = client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            response.raise_for_status()
            result = response.json()["response"]
            logger.info(f"Ollama raw response: {result[:300]}...")

            # Parse JSON from response
            start = result.find("{")
            end = result.rfind("}") + 1
            if start != -1 and end > start:
                json_str = result[start:end]
                parsed = json.loads(json_str)
            else:
                parsed = json.loads(result)

            # Validate structure
            if not isinstance(parsed, dict):
                logger.error("Ollama returned non-dict response")
                return None

            # Ensure all required keys exist
            parsed.setdefault("decisions", [])
            parsed.setdefault("action_items", [])
            parsed.setdefault("risks", [])

            logger.info(
                f"✅ Ollama extracted: {len(parsed['decisions'])} decisions, "
                f"{len(parsed['action_items'])} action items, "
                f"{len(parsed['risks'])} risks"
            )
            return parsed

    except httpx.ConnectError:
        logger.error("❌ Cannot connect to Ollama. Is it running? Run: ollama serve")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"❌ Ollama returned invalid JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Ollama extraction failed: {e}")
        return None


def extract_with_openai(llm, transcript_text: str) -> dict:
    """Extract using OpenAI API."""
    from openai import OpenAIError

    try:
        logger.info("🤖 Sending transcript to OpenAI for extraction...")
        response = llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript_text},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content
        logger.info(f"OpenAI response: {content[:200]}...")
        parsed = json.loads(content)
        parsed.setdefault("decisions", [])
        parsed.setdefault("action_items", [])
        parsed.setdefault("risks", [])
        return parsed

    except (OpenAIError, json.JSONDecodeError, Exception) as e:
        logger.error(f"❌ OpenAI extraction failed: {e}")
        return None


def extract_decisions_and_actions(llm, transcript_text: str) -> dict:
    """
    Main extraction function.
    - If USE_OLLAMA=true, use Ollama directly (skip OpenAI).
    - Otherwise, try OpenAI first, then Ollama fallback.
    """
    if not transcript_text or not transcript_text.strip():
        logger.warning("Empty transcript provided, returning empty results")
        return {"decisions": [], "action_items": [], "risks": []}

    logger.info(f"📝 Extracting from transcript ({len(transcript_text)} chars)...")

    # If USE_OLLAMA is set, skip OpenAI entirely
    if USE_OLLAMA:
        logger.info("🦙 USE_OLLAMA=true, using Ollama directly")
        result = extract_with_ollama(transcript_text)
        if result:
            return result
        logger.error("❌ Ollama extraction failed, returning empty results")
        return {"decisions": [], "action_items": [], "risks": []}

    # Otherwise try OpenAI first, then Ollama fallback
    if llm is not None:
        result = extract_with_openai(llm, transcript_text)
        if result:
            return result
        logger.info("🔄 OpenAI failed, trying Ollama fallback...")

    result = extract_with_ollama(transcript_text)
    if result:
        return result

    logger.error("❌ All extraction methods failed, returning empty results")
    return {"decisions": [], "action_items": [], "risks": []}