import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.base import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
