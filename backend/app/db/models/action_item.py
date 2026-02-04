import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.base import Base

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String, default="open")  # open / done
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
