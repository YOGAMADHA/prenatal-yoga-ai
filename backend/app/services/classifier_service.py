from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np

from app.config import get_settings
from app.schemas import ClassifyRequest, ClassifyResponse

POSE_ALIASES = {
    "mountain": "mountain",
    "cat-cow": "cat-cow",
    "child-pose": "child-pose",
    "warrior-1": "warrior-1",
    "warrior-2": "warrior-2",
    "bridge": "bridge",
    "downward-dog": "downward-dog",
    "seated-forward-bend": "seated-forward-bend",
    "supine-twist": "supine-twist",
    "pigeon": "pigeon",
}

ALTERNATIVES = {
    "supine-twist": "side-lying breathing or gentle seated twist with open chest",
    "bridge": "supported bridge with bolster or pelvic tilts",
    "downward-dog": "hands-and-knees with cat-cow or child's pose",
    "seated-forward-bend": "wide-knee child's pose or supported butterfly",
    "warrior-1": "supported warrior at wall or high lunge with hands on hips",
    "warrior-2": "chair-assisted warrior or shorter stance",
    "pigeon": "figure-four stretch on back or seated figure-four",
}


@lru_cache
def _load_artifact():
    path = Path(get_settings().pose_model_path)
    if not path.is_file():
        return None
    obj = joblib.load(path)
    if isinstance(obj, dict) and "pipeline" in obj:
        return obj["pipeline"], obj.get("label_encoder")
    return obj, None


def _normalize_pose(name: str) -> str:
    key = name.strip().lower().replace(" ", "-")
    return POSE_ALIASES.get(key, key)


def classify_pose(req: ClassifyRequest) -> ClassifyResponse:
    loaded = _load_artifact()
    if loaded is None or loaded[0] is None:
        return _rule_based_fallback(req)

    pipe, label_encoder = loaded
    pose = _normalize_pose(req.pose_name)
    row = np.array(
        [
            [
                req.trimester,
                req.weeks_pregnant,
                req.age,
                req.bmi,
                req.heart_rate,
                int(req.has_hypertension),
                int(req.has_diabetes),
            ]
        ]
    )
    X = np.hstack([row, _pose_one_hot_row(pose)])
    proba = pipe.predict_proba(X)[0]
    classes = np.asarray(pipe.classes_)

    idx = int(np.argmax(proba))
    enc_label = classes[idx]
    if label_encoder is not None:
        label_str = str(label_encoder.inverse_transform([int(enc_label)])[0])
    else:
        label_str = str(enc_label)

    confidence = float(proba[idx])
    reason, alt = _explain(pose, label_str, req.trimester, req)
    return ClassifyResponse(
        pose_label=label_str,  # type: ignore[arg-type]
        confidence_score=confidence,
        safety_reason=reason,
        alternative_pose=alt,
    )


def _pose_one_hot_row(pose: str) -> np.ndarray:
    poses = [
        "mountain",
        "cat-cow",
        "child-pose",
        "warrior-1",
        "warrior-2",
        "bridge",
        "downward-dog",
        "seated-forward-bend",
        "supine-twist",
        "pigeon",
    ]
    v = np.zeros((1, len(poses)), dtype=float)
    if pose in poses:
        v[0, poses.index(pose)] = 1.0
    return v


def _rule_based_fallback(req: ClassifyRequest) -> ClassifyResponse:
    """Used when model file is missing (dev bootstrap)."""
    pose = _normalize_pose(req.pose_name)
    t = req.trimester
    unsafe_supine_t3 = pose in {"supine-twist", "bridge"} and t == 3
    modify_dd = pose == "downward-dog" and t == 3
    unsafe_high_risk = req.has_hypertension and pose in {"bridge", "downward-dog", "warrior-1"}

    if unsafe_supine_t3 or unsafe_high_risk:
        label = "unsafe"
    elif modify_dd or (t == 3 and pose in {"warrior-1", "warrior-2"}):
        label = "modify"
    else:
        label = "safe"

    reason, alt = _explain(pose, label, t, req)
    return ClassifyResponse(
        pose_label=label,  # type: ignore[arg-type]
        confidence_score=0.75,
        safety_reason=reason + " (fallback rules; train model for ML confidence)",
        alternative_pose=alt,
    )


def _explain(pose: str, label: str, trimester: int, req: ClassifyRequest) -> tuple[str, str | None]:
    alt = ALTERNATIVES.get(pose)
    if label == "safe":
        return (
            f"{pose} appears appropriate for trimester {trimester} given your profile.",
            None,
        )
    if label == "modify":
        return (
            f"Use a supported or shortened variation of {pose} during trimester {trimester}.",
            alt,
        )
    if req.has_hypertension:
        return (
            "Higher exertion or inverted-adjacent poses may need medical clearance with hypertension.",
            alt or "gentle breathing and side-lying rest",
        )
    if trimester == 3 and pose in {"supine-twist", "bridge"}:
        return (
            "Supine or strong back-bending may be discouraged in the third trimester for many users.",
            alt,
        )
    return ("This pose may not be ideal right now; choose a gentler alternative.", alt)


def clear_classifier_cache() -> None:
    _load_artifact.cache_clear()
