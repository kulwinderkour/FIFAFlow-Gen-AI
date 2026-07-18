"""
Shared pytest fixtures for StadiumMind backend tests.
Uses an in-memory SQLite database so tests are fully isolated
and never touch the production/development DB file.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db, DBSetting, DBEmergencyState

# ── In-memory test database (shared connection via StaticPool) ───────────────
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _seed_defaults(db):
    """Seed the test DB with the same defaults as init_db()."""
    for k, v in {
        "weather": "Clear",
        "match_time_minutes": "45",
        "attendance": "68000",
        "active_crisis": "none",
    }.items():
        if not db.query(DBSetting).filter(DBSetting.key == k).first():
            db.add(DBSetting(key=k, value=v))

    if not db.query(DBEmergencyState).filter(DBEmergencyState.key == "active_crisis").first():
        db.add(DBEmergencyState(
            key="active_crisis", type="none", severity="low",
            instructions="", announcement=""
        ))
    db.commit()


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables, seed defaults, yield, then drop everything."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    _seed_defaults(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client():
    """Yields a TestClient backed by the in-memory test DB."""
    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
