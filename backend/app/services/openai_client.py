import os
import logging

logger = logging.getLogger(__name__)


def get_llm():
    """Get the LLM client. Returns OpenAI client or None if using Ollama."""
    use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"
    api_key = os.getenv("OPENAI_API_KEY")

    if use_ollama:
        logger.info("🦙 USE_OLLAMA=true — OpenAI client not needed")
        return None

    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY is not set. Either set it or use USE_OLLAMA=true"
        )

    from openai import OpenAI
    return OpenAI(api_key=api_key)