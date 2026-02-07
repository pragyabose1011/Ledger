import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship  # ← add this

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # ← add this
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    action_items = relationship("ActionItem", back_populates="owner")
