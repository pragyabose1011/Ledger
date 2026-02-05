from pydantic import BaseModel

class ExtractRequest(BaseModel):
    transcript_id: str
