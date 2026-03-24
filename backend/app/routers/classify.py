from fastapi import APIRouter

from app.schemas import ClassifyRequest, ClassifyResponse
from app.services.classifier_service import classify_pose

router = APIRouter()


@router.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest) -> ClassifyResponse:
    return classify_pose(req)
