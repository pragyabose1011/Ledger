import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    platform = Column(String, nullable=True)  # Zoom / Meet / Teams
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)  # ← new field to link to User
    created_at = Column(DateTime(timezone=True), server_default=func.now())
