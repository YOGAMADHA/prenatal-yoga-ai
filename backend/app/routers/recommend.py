from fastapi import APIRouter

from app.schemas import RecommendRequest, RecommendResponse
from app.services.recommendation import recommend_videos

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> RecommendResponse:
    items = recommend_videos(req, top_k=5)
    return RecommendResponse(recommendations=items)
