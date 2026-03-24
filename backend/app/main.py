from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, bootstrap, chat, classify, pose_log, profile, recommend

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    import app.models  # noqa: F401 — register models on Base.metadata before create_all

    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Prenatal Yoga Safety API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list if settings.cors_origin_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(classify.router, prefix="/api", tags=["classify"])
app.include_router(recommend.router, prefix="/api", tags=["recommend"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(pose_log.router, prefix="/api", tags=["pose"])
app.include_router(bootstrap.router, prefix="/api", tags=["bootstrap"])


@app.get("/")
def root():
    return {"message": "Prenatal Yoga Safety API", "docs": "/docs"}
