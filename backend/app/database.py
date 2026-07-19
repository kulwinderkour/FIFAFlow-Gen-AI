import datetime
import logging

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings
from app.db_utils import seed_database_defaults

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

class DBSetting(Base):
    __tablename__ = "settings"
    key = Column(String(50), primary_key=True, index=True)
    value = Column(String(200))

class DBActiveIncident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(50))  # "lost_child", "medical", "security", "structural"
    location = Column(String(100))
    description = Column(Text)
    reported_by = Column(String(100))
    status = Column(String(50), default="active")  # "active", "resolved"
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
    sop_steps = Column(Text, nullable=True)  # SOP instructions from AI
    emergency_contact = Column(String(100), nullable=True)

class DBChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(50))  # "user" or "assistant"
    content = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
    user_role = Column(String(50), default="fan")  # "fan", "volunteer", "organizer", "staff"

class DBEmergencyState(Base):
    __tablename__ = "emergency_state"
    key = Column(String(50), primary_key=True, index=True)  # e.g., "active_crisis"
    type = Column(String(50), default="none")  # "none", "fire_alarm", "power_failure", "heavy_rain", "medical_emergency"
    severity = Column(String(50), default="low")  # "low", "medium", "high"
    instructions = Column(Text, nullable=True)
    announcement = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database_defaults(db)
    except Exception as exc:
        logger.error("Error seeding database: %s", exc)
        db.rollback()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
