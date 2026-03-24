import datetime as dt

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    health_profiles = relationship("HealthProfile", back_populates="user")
    yoga_sessions = relationship("YogaSession", back_populates="user")
    pose_logs = relationship("PoseLog", back_populates="user")


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    trimester = Column(Integer, nullable=False)
    age = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    medical_conditions = Column(JSON, nullable=False, default=list)
    heart_rate = Column(Integer, nullable=False)
    weeks_pregnant = Column(Integer, nullable=False)
    raw_payload = Column(JSON, nullable=True)
    preprocessed_vector = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    user = relationship("User", back_populates="health_profiles")


class YogaSession(Base):
    __tablename__ = "yoga_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=dt.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="yoga_sessions")


class PoseLog(Base):
    __tablename__ = "pose_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    pose_name = Column(String(128), nullable=True)
    trimester = Column(Integer, nullable=True)
    safety_status = Column(String(32), nullable=False)
    joint_angles = Column(JSON, nullable=True)
    correction_tip = Column(Text, nullable=True)
    is_unsafe = Column(Boolean, default=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    user = relationship("User", back_populates="pose_logs")
