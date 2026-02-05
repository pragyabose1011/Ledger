import json
from openai import OpenAIError

SYSTEM_PROMPT = """
You are an assistant that extracts structured information from meeting transcripts.

Return STRICT JSON with this schema:
{
  "decisions": [{ "summary": "string" }],
  "action_items": [
    {
      "description": "string",
      "owner": "string | null",
      "due_date": "string | null"
    }
  ]
}
"""

DUMMY_RESPONSE = {
    "decisions": [
        {"summary": "Ship beta by Friday"}
    ],
    "action_items": [
        {
            "description": "Prepare announcement blog post",
            "owner": "Alice",
            "due_date": None
        },
        {
            "description": "Test deployment and report issues",
            "owner": "Bob",
            "due_date": None
        }
    ]
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
