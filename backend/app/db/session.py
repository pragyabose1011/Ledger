from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models so they're registered with Base
from app.db.models.user import User  # noqa
from app.db.models.meeting import Meeting  # noqa
from app.db.models.meeting_participant import MeetingParticipant  # noqa
from app.db.models.decision import Decision  # noqa
from app.db.models.action_item import ActionItem  # noqa
from app.db.models.transcript import Transcript  # noqa
from app.db.base import Base
from app.db.models.alert import Alert  # noqa  # add this
from app.db.models.risk import Risk  # noqa  # add this

DATABASE_URL = "sqlite:///./ledger.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

