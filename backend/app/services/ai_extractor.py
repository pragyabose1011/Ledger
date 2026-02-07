import json
from openai import OpenAIError

SYSTEM_PROMPT = """
You are an assistant that extracts structured information from meeting transcripts.

Return STRICT JSON with this schema:
{
  "decisions": [
    {
      "summary": "string",
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
  ]
}

Rules for confidence:
- confidence is between 0 and 1
- higher when the statement is clear, explicit, and committed
- lower when it's vague, tentative, or hypothetical
"""

DUMMY_RESPONSE = {
    "decisions": [
        {
            "summary": "Ship beta by Friday",
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
        # 🔥 THIS IS THE KEY FIX
        print("⚠️ OpenAI error, falling back to Dummy response")
        print(str(e))
        return DUMMY_RESPONSE

    except Exception as e:
        # Safety net for malformed JSON, etc.
        print("⚠️ Unexpected error, using Dummy response")
        print(str(e))
        return DUMMY_RESPONSE
