import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
