# /Users/pragyabose/Ledger/backend/app/db/models/decision.py
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func

from app.db.base import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)  # ← NEW: decision owner
    summary = Column(Text, nullable=False)
    source_sentence = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())