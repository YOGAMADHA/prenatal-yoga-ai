from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PoseLog
from app.schemas import PoseLogCreate, PoseLogResponse

router = APIRouter()


@router.post("/pose-log", response_model=PoseLogResponse)
def log_pose_event(payload: PoseLogCreate, db: Session = Depends(get_db)):
    row = PoseLog(
        user_id=payload.user_id,
        pose_name=payload.pose_name,
        trimester=payload.trimester,
        safety_status=payload.safety_status,
        joint_angles=payload.joint_angles,
        correction_tip=payload.correction_tip,
        is_unsafe=payload.is_unsafe,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PoseLogResponse(id=row.id)
