import json

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

def extract_decisions_and_actions(llm, transcript_text: str) -> dict:
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
