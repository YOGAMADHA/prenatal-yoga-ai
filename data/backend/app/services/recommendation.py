from __future__ import annotations

import ast
import csv
import re
from functools import lru_cache
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import get_settings
from app.schemas import RecommendRequest, VideoOut


_YT_ID_RE = re.compile(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})")


def _youtube_watch_and_thumb(url: str) -> tuple[str, str]:
    """Normalize to standard watch URL + official thumbnail."""
    m = _YT_ID_RE.search(url or "")
    vid = m.group(1) if m else ""
    if not vid:
        return (url or "", "")
    watch = f"https://www.youtube.com/watch?v={vid}"
    thumb = f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
    return watch, thumb


def _parse_trimester_safe(cell: str) -> list[int]:
    cell = cell.strip()
    try:
        v = ast.literal_eval(cell)
        if isinstance(v, list):
            return [int(x) for x in v]
    except (ValueError, SyntaxError):
        pass
    return [int(x) for x in cell.replace("[", "").replace("]", "").split(",") if x.strip().isdigit()]


@lru_cache
def _load_catalog():
    path = Path(get_settings().yoga_videos_csv)
    rows: list[dict] = []
    if not path.is_file():
        return rows, None, None

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            r["trimester_safe"] = _parse_trimester_safe(r.get("trimester_safe", "[]"))
            yurl, thumb = _youtube_watch_and_thumb(r.get("youtube_url", ""))
            if yurl:
                r["youtube_url"] = yurl
            if thumb:
                r["thumbnail_url"] = thumb
            rows.append(r)

    corpus = []
    for r in rows:
        text = f"{r.get('pose_name','')} {r.get('description','')} {r.get('intensity','')}"
        corpus.append(text)

    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    if corpus:
        X = vectorizer.fit_transform(corpus)
    else:
        X = None
    return rows, vectorizer, X


def recommend_videos(req: RecommendRequest, top_k: int = 5) -> list[VideoOut]:
    rows, vectorizer, X = _load_catalog()
    if not rows or vectorizer is None or X is None:
        return []

    query_bits = [
        f"trimester {req.trimester}",
        " ".join(req.safe_poses or []),
        req.intensity_preference if req.intensity_preference != "any" else "",
    ]
    query = " ".join(b for b in query_bits if b).strip() or f"trimester {req.trimester}"
    q_vec = vectorizer.transform([query])

    sims = cosine_similarity(q_vec, X).flatten()
    order = np.argsort(-sims)

    out: list[VideoOut] = []
    for idx in order:
        r = rows[int(idx)]
        if req.trimester not in r["trimester_safe"]:
            continue
        if req.intensity_preference != "any" and r.get("intensity") != req.intensity_preference:
            continue
        if req.safe_poses and r.get("pose_name") not in req.safe_poses:
            continue
        out.append(
            VideoOut(
                video_id=r["video_id"],
                title=r["title"],
                pose_name=r["pose_name"],
                trimester_safe=r["trimester_safe"],
                intensity=r["intensity"],
                duration_minutes=int(r["duration_minutes"]),
                description=r["description"],
                youtube_url=r["youtube_url"],
                thumbnail_url=r["thumbnail_url"],
                similarity_score=float(sims[idx]),
            )
        )
        if len(out) >= top_k:
            break

    if len(out) < top_k:
        for idx in order:
            r = rows[int(idx)]
            if req.trimester not in r["trimester_safe"]:
                continue
            if any(v.video_id == r["video_id"] for v in out):
                continue
            out.append(
                VideoOut(
                    video_id=r["video_id"],
                    title=r["title"],
                    pose_name=r["pose_name"],
                    trimester_safe=r["trimester_safe"],
                    intensity=r["intensity"],
                    duration_minutes=int(r["duration_minutes"]),
                    description=r["description"],
                    youtube_url=r["youtube_url"],
                    thumbnail_url=r["thumbnail_url"],
                    similarity_score=float(sims[idx]),
                )
            )
            if len(out) >= top_k:
                break

    return out[:top_k]
