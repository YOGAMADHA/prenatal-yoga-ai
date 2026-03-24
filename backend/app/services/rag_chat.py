from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config import get_settings
from app.services.conversation_memory import ConversationBufferMemory
from app.schemas import ChatRequest, ChatResponse, SourceDocument

SYSTEM_PROMPT = """You are a certified prenatal yoga assistant. Only answer questions related to pregnancy and yoga safety. If user mentions pain, bleeding, or emergency symptoms, always say: Please stop and consult your doctor immediately.

Use the CONTEXT below when it helps. If context is insufficient, give cautious general guidance and suggest discussing with a clinician."""


def _knowledge_path() -> Path:
    return Path(get_settings().knowledge_chunks_path)


def _load_text_chunks() -> list[str]:
    path = _knowledge_path()
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    return [p.strip() for p in text.split("\n---\n") if p.strip()]


@lru_cache
def _vectorstore() -> FAISS | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    chunks = _load_text_chunks()
    if not chunks:
        return None
    emb = OpenAIEmbeddings(
        openai_api_key=settings.openai_api_key,
        model="text-embedding-ada-002",
    )
    metadatas = [{"chunk_id": i} for i in range(len(chunks))]
    return FAISS.from_texts(chunks, embedding=emb, metadatas=metadatas)


def _emergency_phrase(user_message: str) -> str | None:
    lower = user_message.lower()
    triggers = ("pain", "bleeding", "cramping", "contractions", "fluid", "fever", "dizzy", "faint")
    if any(t in lower for t in triggers):
        return "Please stop and consult your doctor immediately."
    return None


def chat_with_rag(req: ChatRequest) -> ChatResponse:
    emergency = _emergency_phrase(req.user_message)
    if emergency:
        return ChatResponse(bot_response=emergency, source_documents=[])

    settings = get_settings()
    if not settings.openai_api_key:
        return ChatResponse(
            bot_response="Chat is unavailable: set OPENAI_API_KEY on the server.",
            source_documents=[],
        )

    store = _vectorstore()
    if store is None:
        return ChatResponse(
            bot_response="Knowledge base is not available.",
            source_documents=[],
        )

    docs = store.similarity_search(req.user_message, k=4)
    context = "\n\n".join(d.page_content for d in docs)

    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    for m in req.conversation_history:
        if m.role == "user":
            memory.chat_memory.add_user_message(m.content)
        elif m.role == "assistant":
            memory.chat_memory.add_ai_message(m.content)

    hist_vars = memory.load_memory_variables({})
    history_text = str(hist_vars.get("chat_history", "") or "").strip()

    trim_note = ""
    if req.trimester is not None:
        trim_note = f"\nUser trimester (for personalization): {req.trimester}\n"

    llm = ChatOpenAI(
        openai_api_key=settings.openai_api_key,
        model="gpt-3.5-turbo",
        temperature=0.2,
    )

    prompt = (
        f"{SYSTEM_PROMPT}{trim_note}\n"
        f"CONTEXT:\n{context}\n\n"
        f"CONVERSATION SO FAR:\n{history_text}\n\n"
        f"Answer the user's latest message clearly and safely."
    )

    resp = llm.invoke(prompt + "\n\nUSER:\n" + req.user_message)
    answer = str(getattr(resp, "content", resp)).strip()

    sources = [
        SourceDocument(content=d.page_content[:1200], metadata=dict(getattr(d, "metadata", {}) or {}))
        for d in docs
    ]
    return ChatResponse(bot_response=answer, source_documents=sources)


def clear_rag_cache() -> None:
    _vectorstore.cache_clear()
