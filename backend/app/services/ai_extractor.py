import json
import os
import httpx
from openai import OpenAIError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

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


def extract_with_ollama(transcript_text: str, model: str = "llama3.1:8b") -> dict:
    """Extract using local Ollama model."""
    prompt = f"""{SYSTEM_PROMPT}

Meeting Transcript:
---
{transcript_text}
---

Extract decisions, action items, and risks from the transcript above. Return ONLY valid JSON:"""

    try:
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
            result = response.json()["response"]
            
            # Try to parse JSON from response
            # Sometimes LLMs add extra text, so find the JSON part
            start = result.find("{")
            end = result.rfind("}") + 1
            if start != -1 and end > start:
                json_str = result[start:end]
                return json.loads(json_str)
            
            return json.loads(result)
    except Exception as e:
        print(f"⚠️ Ollama extraction failed: {e}")
        return None


def extract_decisions_and_actions(llm, transcript_text: str) -> dict:
    try:
        logger.info("Sending transcript to OpenAI for extraction.")
        response = llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript_text}
            ],
            temperature=0
        )
        content = response.choices[0].message.content
        logger.info(f"OpenAI response: {content[:200]}...")  # Log first 200 chars
        return json.loads(content)

    except OpenAIError as e:
        logger.error(f"⚠️ OpenAI error: {e}")
        logger.info("🔄 Trying Ollama fallback...")
        ollama_result = extract_with_ollama(transcript_text)
        if ollama_result:
            logger.info("✅ Ollama extraction successful")
            return ollama_result
        logger.error("⚠️ Both OpenAI and Ollama failed, returning empty results")
        return {
            "decisions": [],
            "action_items": [],
            "risks": [],
        }
    except json.JSONDecodeError as e:
        logger.error(f"⚠️ JSON parse error: {e}")
        return {
            "decisions": [],
            "action_items": [],
            "risks": [],
        }
    except Exception as e:
        logger.error(f"⚠️ Unexpected error: {e}")
        return {
            "decisions": [],
            "action_items": [],
            "risks": [],
        }
    
def extract_with_ollama(transcript_text: str, model: str = "llama3.1:8b") -> dict:
    prompt = f"""{SYSTEM_PROMPT}

    Meeting Transcript:
    ---
    {transcript_text}
    ---

    Extract decisions, action items, and risks from the transcript above. Return ONLY valid JSON:"""

    try:
        logger.info(f"Sending prompt to Ollama: {prompt[:200]}...")  # Log first 200 chars
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
            logger.info(f"Ollama raw response: {response.text}")
            result = response.json()["response"]
            logger.info(f"Ollama extracted response: {result[:200]}...")  # Log first 200 chars

            start = result.find("{")
            end = result.rfind("}") + 1
            if start != -1 and end > start:
                json_str = result[start:end]
                return json.loads(json_str)
            return json.loads(result)
    except Exception as e:
        logger.error(f"⚠️ Ollama extraction failed: {e}")
        return None