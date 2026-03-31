from sqlalchemy import Column, String, ForeignKey
from app.db.base import Base

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    meeting_id = Column(String(36), ForeignKey("meetings.id"), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    role = Column(String(100), nullable=True)
