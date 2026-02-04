from sqlalchemy import Column, String, ForeignKey
from app.db.base import Base

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    meeting_id = Column(String, ForeignKey("meetings.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    role = Column(String, nullable=True)  # host / attendee
