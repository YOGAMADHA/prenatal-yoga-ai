from fastapi import APIRouter

from app.schemas import ChatRequest, ChatResponse
from app.services.rag_chat import chat_with_rag

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    return chat_with_rag(req)
