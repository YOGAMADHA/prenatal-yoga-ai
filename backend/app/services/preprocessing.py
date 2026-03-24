from __future__ import annotations

import math
from typing import Any

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder

from app.schemas import MedicalCondition, ProfileCreateRequest


def compute_bmi(weight_kg: float, height_cm: float) -> float:
    h_m = height_cm / 100.0
    return round(weight_kg / (h_m * h_m), 2)


def _condition_flags(conditions: list[MedicalCondition]) -> dict[str, int]:
    s = set(conditions)
    if MedicalCondition.NONE in s:
        return {"hypertension": 0, "diabetes": 0, "back_pain": 0}
    return {
        "hypertension": int(MedicalCondition.HYPERTENSION in s),
        "diabetes": int(MedicalCondition.DIABETES in s),
        "back_pain": int(MedicalCondition.BACK_PAIN in s),
    }


def build_profile_preprocessing_pipeline() -> ColumnTransformer:
    """Domain-based MinMaxScaler + OneHotEncoder for trimester + condition flags."""
    numeric_bounds = np.array(
        [
            [16, 35, 130, 40, 1, 18],  # mins
            [55, 150, 210, 180, 42, 45],  # maxes (bmi plausible range)
        ]
    )
    trimester_bounds = np.array([[1, 2, 3]]).T

    num_ix = [0, 1, 2, 3, 4, 5]
    trim_ix = [6]
    cond_ix = [7, 8, 9]

    num_scaler = MinMaxScaler()
    num_scaler.fit(numeric_bounds)

    trim_ohe = OneHotEncoder(categories=[list(range(1, 4))], sparse_output=False, handle_unknown="ignore")
    trim_ohe.fit(trimester_bounds)

    cond_scaler = MinMaxScaler()
    cond_scaler.fit(np.array([[0, 0, 0], [1, 1, 1]]))

    return ColumnTransformer(
        transformers=[
            ("num", num_scaler, num_ix),
            ("trim", trim_ohe, trim_ix),
            ("cond", cond_scaler, cond_ix),
        ]
    )


FEATURE_ORDER = (
    ["age", "weight_kg", "height_cm", "heart_rate", "weeks_pregnant", "bmi"]
    + ["trimester_1", "trimester_2", "trimester_3"]
    + ["hypertension", "diabetes", "back_pain"]
)


def profile_to_feature_matrix(req: ProfileCreateRequest, bmi: float) -> np.ndarray:
    flags = _condition_flags(req.medical_conditions)
    return np.array(
        [
            [
                req.age,
                req.weight_kg,
                req.height_cm,
                req.heart_rate,
                req.weeks_pregnant,
                bmi,
                req.trimester,
                flags["hypertension"],
                flags["diabetes"],
                flags["back_pain"],
            ]
        ]
    )


def preprocess_profile(req: ProfileCreateRequest) -> tuple[float, list[float], dict[str, Any]]:
    bmi = compute_bmi(req.weight_kg, req.height_cm)
    pipe = build_profile_preprocessing_pipeline()
    X = profile_to_feature_matrix(req, bmi)
    Xt = pipe.fit_transform(X)
    vec = np.asarray(Xt).flatten().astype(float)
    if not all(math.isfinite(x) for x in vec):
        raise ValueError("Preprocessing produced non-finite values.")
    raw_record: dict[str, Any] = {
        "trimester": req.trimester,
        "age": req.age,
        "weight_kg": req.weight_kg,
        "height_cm": req.height_cm,
        "bmi": bmi,
        "medical_conditions": [c.value for c in req.medical_conditions],
        "heart_rate": req.heart_rate,
        "weeks_pregnant": req.weeks_pregnant,
        "_feature_order": list(FEATURE_ORDER),
    }
    return bmi, list(vec), raw_record


def sklearn_pipeline_object() -> Pipeline:
    return Pipeline([("prep", build_profile_preprocessing_pipeline())])
