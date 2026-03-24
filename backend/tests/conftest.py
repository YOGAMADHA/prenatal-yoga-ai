import os
from pathlib import Path

# Use SQLite for unit tests (no Postgres required)
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_prenatal.db")

_REPO = Path(__file__).resolve().parents[2]
os.environ.setdefault("POSE_MODEL_PATH", str(_REPO / "models" / "pose_classifier.pkl"))
os.environ.setdefault("YOGA_VIDEOS_CSV", str(_REPO / "data" / "yoga_videos.csv"))
os.environ.setdefault(
    "KNOWLEDGE_CHUNKS_PATH",
    str(_REPO / "data" / "knowledge" / "prenatal_qa_chunks.txt"),
)

# Create tables before any test module imports `app` (import order: conftest → tests).
from app.config import get_settings  # noqa: E402

get_settings.cache_clear()
import app.models  # noqa: E402, F401
from app.database import Base, engine  # noqa: E402

Base.metadata.create_all(bind=engine)
