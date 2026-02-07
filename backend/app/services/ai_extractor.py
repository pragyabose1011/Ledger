# /Users/pragyabose/Ledger/backend/app/services/ai_extractor.py
import json
from openai import OpenAIError

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
"""

DUMMY_RESPONSE = {
    "decisions": [
        {
            "summary": "Ship beta by Friday",
            "owner": "Alice",
            "source_sentence": "Alice: We should ship version 2 by Monday.",
            "confidence": 0.9,
        }
    ],
    "action_items": [
        {
            "description": "Prepare announcement blog post",
            "owner": "Alice",
            "due_date": None,
            "source_sentence": "Bob: I will prepare the migration plan.",
            "confidence": 0.85,
        },
        {
            "description": "Test deployment and report issues",
            "owner": "Bob",
            "due_date": None,
            "source_sentence": "Charlie: Let's review metrics next sprint.",
            "confidence": 0.8,
        },
    ],
    "risks": [
        {
            "description": "Launch date may slip if testing finds blockers",
            "source_sentence": "Charlie: If QA finds major bugs, we might miss Friday.",
            "confidence": 0.8,
        }
    ],
}


def extract_decisions_and_actions(llm, transcript_text: str) -> dict:
    try:
        response = llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript_text}
            ],
            temperature=0
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except OpenAIError as e:
        print("⚠️ OpenAI error, falling back to Dummy response")
        print(str(e))
        return DUMMY_RESPONSE

    except Exception as e:
        print("⚠️ Unexpected error, using Dummy response")
        print(str(e))
        return DUMMY_RESPONSE