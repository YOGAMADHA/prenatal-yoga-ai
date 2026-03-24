from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class MedicalCondition(str, Enum):
    HYPERTENSION = "hypertension"
    DIABETES = "diabetes"
    BACK_PAIN = "back_pain"
    NONE = "none"


class ProfileCreateRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    trimester: Literal[1, 2, 3]
    age: int = Field(..., ge=16, le=55)
    weight_kg: float = Field(..., ge=35, le=150)
    height_cm: float = Field(..., ge=130, le=210)
    medical_conditions: list[MedicalCondition] = Field(default_factory=list)
    heart_rate: int = Field(..., ge=40, le=180)
    weeks_pregnant: int = Field(..., ge=1, le=42)

    @field_validator("medical_conditions")
    @classmethod
    def validate_conditions(cls, v: list[MedicalCondition]) -> list[MedicalCondition]:
        if MedicalCondition.NONE in v and len(v) > 1:
            raise ValueError("If 'none' is selected, no other conditions may be listed.")
        return v

    @model_validator(mode="after")
    def trimester_weeks_consistency(self):
        t, w = self.trimester, self.weeks_pregnant
        ranges = {1: (1, 13), 2: (14, 27), 3: (28, 42)}
        lo, hi = ranges[t]
        if not (lo <= w <= hi):
            raise ValueError(
                f"weeks_pregnant {w} is outside typical range for trimester {t} ({lo}-{hi})."
            )
        return self


class ProfileCreateResponse(BaseModel):
    user_id: int
    bmi: float
    preprocessed_feature_vector: list[float]
    message: str = "Profile saved and preprocessed successfully."


class ClassifyRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    trimester: Literal[1, 2, 3]
    weeks_pregnant: int = Field(..., ge=1, le=42)
    age: int = Field(..., ge=16, le=55)
    bmi: float = Field(..., ge=14, le=60)
    heart_rate: int = Field(..., ge=40, le=180)
    has_hypertension: bool = False
    has_diabetes: bool = False
    pose_name: str = Field(..., min_length=2, max_length=64)


class ClassifyResponse(BaseModel):
    pose_label: Literal["safe", "unsafe", "modify"]
    confidence_score: float
    safety_reason: str
    alternative_pose: str | None = None


class RecommendRequest(BaseModel):
    trimester: Literal[1, 2, 3]
    safe_poses: list[str] = Field(default_factory=list)
    intensity_preference: Literal["low", "medium", "any"] = "any"


class VideoOut(BaseModel):
    video_id: str
    title: str
    pose_name: str
    trimester_safe: list[int]
    intensity: str
    duration_minutes: int
    description: str
    youtube_url: str
    thumbnail_url: str
    similarity_score: float


class RecommendResponse(BaseModel):
    recommendations: list[VideoOut]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=4000)
    conversation_history: list[ChatMessage] = Field(default_factory=list)
    trimester: int | None = Field(default=None, ge=1, le=3)


class SourceDocument(BaseModel):
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    bot_response: str
    source_documents: list[SourceDocument]


class PoseLogCreate(BaseModel):
    user_id: int | None = Field(default=None, ge=1)
    pose_name: str | None = None
    trimester: int | None = Field(default=None, ge=1, le=3)
    safety_status: str
    joint_angles: dict[str, float] | None = None
    correction_tip: str | None = None
    is_unsafe: bool = False


class PoseLogResponse(BaseModel):
    id: int
    message: str = "Pose event logged."


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
