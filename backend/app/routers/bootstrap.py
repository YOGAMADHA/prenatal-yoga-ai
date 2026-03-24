"""Dev helpers: create default user for onboarding flows."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

router = APIRouter()


@router.post("/ensure-user")
def ensure_user(email: str = "demo@example.com", db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return {"id": existing.id, "email": existing.email}
    u = User(email=email, hashed_password="demo-not-used")
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "email": u.email}
