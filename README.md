# Prenatal Yoga AI — ML-Based Real-Time Safety System

This repository contains a full-stack prototype for a **prenatal yoga safety** application: health profiling with preprocessing, an XGBoost pose classifier, TF‑IDF video recommendations, a RAG chatbot (OpenAI + FAISS), and a React UI with TensorFlow.js MoveNet webcam feedback.

## Architecture (text diagram)

```
┌──────────────┐      ┌─────────────────────┐      ┌──────────────┐
│ React (Vite) │ HTTP │ FastAPI (Python 3.10)│ ORM  │ PostgreSQL   │
│ Tailwind UI  │─────▶│ /api/* routes        │─────▶│ users,       │
│ TF.js MoveNet│      │ ML + LangChain RAG   │      │ profiles,    │
└──────────────┘      └──────────┬───────────┘      │ sessions,    │
                                 │ joblib           │ pose_logs    │
                                 ▼                  └──────────────┘
                          models/pose_classifier.pkl
                          data/yoga_videos.csv
                          data/knowledge/*.txt
```

## Features

- **Health onboarding** with Pydantic validation, sklearn preprocessing, and persistence in PostgreSQL.
- **Pose classifier** trained on a synthetic trimester-aware dataset (XGBoost + sklearn pipeline).
- **Recommendations** using TF‑IDF + cosine similarity, filtered by trimester and safe poses.
- **Chat** using FAISS + OpenAI embeddings + `gpt-3.5-turbo` generation (requires `OPENAI_API_KEY`).
- **Webcam safety overlay** using MoveNet (TensorFlow.js) with trimester thresholds.

## Local setup

### Prerequisites

- Python 3.10+ recommended (tests also run on newer interpreters if dependencies install).
- Node.js 18+ for the frontend.
- PostgreSQL if you run the API against Postgres (Docker Compose provides one).

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy ..\.env.example .env     # adjust DATABASE_URL, secrets, keys
```

For a quick local database without Postgres, set `DATABASE_URL=sqlite:///./prenatal.db` in `.env` (SQLAlchemy will create the file on first run).

Generate data + train the classifier (from repo root):

```bash
python scripts/generate_synthetic_dataset.py
python scripts/train_pose_classifier.py
python scripts/generate_yoga_videos_csv.py
```

Run API:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000` (see `frontend/vite.config.js`).

### Docker Compose

```bash
docker compose up --build
```

- Frontend (Nginx): `http://localhost:8080` (proxies `/api` to backend)
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

Mount `./models` and `./data` into the backend container for the classifier, CSV catalog, and knowledge chunks.

## API reference

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/` | Health message |
| `POST` | `/api/auth/register` | Register (`email`, `password` min 8 chars, optional `full_name`) → JWT |
| `POST` | `/api/auth/login` | Login (`email`, `password`) → JWT |
| `GET` | `/api/auth/me` | Current user (requires `Authorization: Bearer <token>`) |
| `POST` | `/api/ensure-user` | Dev helper: create user without password (legacy) |
| `POST` | `/api/profile` | Save health profile (**requires Bearer token**; `user_id` must match account) |
| `POST` | `/api/classify` | Classify a pose label (`safe` / `unsafe` / `modify`) |
| `POST` | `/api/recommend` | Top‑5 TF‑IDF video recommendations |
| `POST` | `/api/chat` | RAG chat (`user_message`, `conversation_history`, optional `trimester`) |
| `POST` | `/api/pose-log` | Log webcam safety events |

Interactive docs: `http://localhost:8000/docs`.

## Environment variables

See `.env.example` for `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, model paths, and CORS.

## CI / CD

GitHub Actions workflow `.github/workflows/deploy.yml` runs `pytest`, builds the Vite app, then attempts Docker Hub pushes and an optional Render deploy webhook. Configure repository secrets:

- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` — image push
- `RENDER_DEPLOY_HOOK_URL` — optional Render redeploy hook

## Render

`render.yaml` defines two Docker web services (backend + frontend). Set `DATABASE_URL` (managed Postgres) and `OPENAI_API_KEY` in the Render dashboard. Ensure model and data artifacts are available in the image or via mounted storage consistent with `POSE_MODEL_PATH` / `YOGA_VIDEOS_CSV` / `KNOWLEDGE_CHUNKS_PATH`.

## Safety disclaimer

This project is educational and not medical advice. Always follow your clinician’s guidance for exercise during pregnancy.
