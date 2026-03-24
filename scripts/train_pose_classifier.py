"""
Train XGBoost classifier pipeline and save to models/pose_classifier.pkl
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parents[1]


def build_X(df: pd.DataFrame) -> np.ndarray:
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
    pose_index = {p: i for i, p in enumerate(poses)}
    oh = np.zeros((len(df), len(poses)), dtype=float)
    for i, p in enumerate(df["pose_name"].tolist()):
        if p in pose_index:
            oh[i, pose_index[p]] = 1.0

    base = df[
        [
            "trimester",
            "weeks_pregnant",
            "age",
            "bmi",
            "heart_rate",
            "has_hypertension",
            "has_diabetes",
        ]
    ].to_numpy(dtype=float)
    return np.hstack([base, oh])


def main() -> None:
    csv_path = ROOT / "data" / "synthetic_yoga_safety.csv"
    if not csv_path.is_file():
        raise SystemExit(f"Missing dataset: {csv_path}. Run generate_synthetic_dataset.py first.")

    df = pd.read_csv(csv_path)
    X = build_X(df)
    y = df["pose_label"].astype(str).to_numpy()

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    numeric_ix = list(range(0, 7))
    pose_ix = list(range(7, 17))

    pre = ColumnTransformer(
        transformers=[
            ("num", MinMaxScaler(), numeric_ix),
            ("pose", "passthrough", pose_ix),
        ]
    )

    clf = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        random_state=42,
        n_jobs=0,
    )

    pipe = Pipeline([("prep", pre), ("model", clf)])
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    print("Classification report:\n")
    print(
        classification_report(
            le.inverse_transform(y_test),
            le.inverse_transform(y_pred),
            labels=list(le.classes_),
        )
    )
    print("Confusion matrix:\n")
    print(confusion_matrix(y_test, y_pred))

    out_path = ROOT / "models" / "pose_classifier.pkl"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipe, "label_encoder": le}, out_path)
    print(f"Saved model to {out_path}")


if __name__ == "__main__":
    main()
