from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import HealthProfile, User
from app.schemas import ProfileCreateRequest, ProfileCreateResponse
from app.services.preprocessing import preprocess_profile

router = APIRouter()


@router.post("/profile", response_model=ProfileCreateResponse)
def create_or_update_profile(
    payload: ProfileCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="user_id does not match authenticated user")

    bmi, vec, raw = preprocess_profile(payload)

    row = HealthProfile(
        user_id=current_user.id,
        trimester=payload.trimester,
        age=payload.age,
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        bmi=bmi,
        medical_conditions=[c.value for c in payload.medical_conditions],
        heart_rate=payload.heart_rate,
        weeks_pregnant=payload.weeks_pregnant,
        raw_payload=raw,
        preprocessed_vector=vec,
    )
    db.add(row)
    db.commit()

    return ProfileCreateResponse(user_id=current_user.id, bmi=bmi, preprocessed_feature_vector=vec)
