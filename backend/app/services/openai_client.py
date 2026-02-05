import os
from openai import OpenAI

class DummyLLM:
    class chat:
        class completions:
            @staticmethod
            def create(*args, **kwargs):
                return type(
                    "Response",
                    (),
                    {
                        "choices": [
                            type(
                                "Choice",
                                (),
                                {
                                    "message": type(
                                        "Msg",
                                        (),
                                        {
                                            "content": """
{
  "decisions": [
    { "summary": "Ship beta by Friday" }
  ],
  "action_items": [
    {
      "description": "Prepare announcement blog post",
      "owner": "Alice",
      "due_date": null
    },
    {
      "description": "Test deployment and report issues",
      "owner": "Bob",
      "due_date": null
    }
  ]
}
"""
                                        },
                                    )
                                },
                            )
                        ]
                    },
                )


def get_llm():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️ OPENAI_API_KEY not set, using DummyLLM")
        return DummyLLM()

    try:
        return OpenAI(api_key=api_key)
    except Exception:
        print("⚠️ OpenAI init failed, using DummyLLM")
        return DummyLLM()
