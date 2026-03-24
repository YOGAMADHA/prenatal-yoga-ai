from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql://postgres:postgres@localhost:5432/prenatal_yoga"
    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    openai_api_key: str = ""
    external_api_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    pose_model_path: str = str(PROJECT_ROOT / "models" / "pose_classifier.pkl")
    yoga_videos_csv: str = str(PROJECT_ROOT / "data" / "yoga_videos.csv")
    knowledge_chunks_path: str = str(
        PROJECT_ROOT / "data" / "knowledge" / "prenatal_qa_chunks.txt"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
