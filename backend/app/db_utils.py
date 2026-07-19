"""Database helper utilities for settings and seeding."""

import logging
from sqlalchemy.orm import Session

from app.constants import DEFAULT_SETTINGS

logger = logging.getLogger(__name__)


def get_setting_value(db: Session, key: str, default: str) -> str:
    """Return a setting value from the database or the provided default."""
    from app.database import DBSetting

    setting = db.query(DBSetting).filter(DBSetting.key == key).first()
    return setting.value if setting else default


def upsert_setting(db: Session, key: str, value: str) -> None:
    """Create or update a single settings row."""
    from app.database import DBSetting

    setting = db.query(DBSetting).filter(DBSetting.key == key).first()
    if setting:
        setting.value = value
        return
    db.add(DBSetting(key=key, value=value))


def seed_database_defaults(db: Session) -> None:
    """Seed default settings and emergency state if they do not exist."""
    from app.database import DBEmergencyState, DBSetting

    for key, value in DEFAULT_SETTINGS.items():
        if not db.query(DBSetting).filter(DBSetting.key == key).first():
            db.add(DBSetting(key=key, value=value))

    if not db.query(DBEmergencyState).filter(DBEmergencyState.key == "active_crisis").first():
        db.add(DBEmergencyState(
            key="active_crisis",
            type="none",
            severity="low",
            instructions="",
            announcement="",
        ))

    db.commit()
