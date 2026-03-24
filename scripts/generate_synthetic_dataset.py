"""
Generate synthetic prenatal yoga safety dataset (1000 rows) with trimester-aware rules.
"""

from __future__ import annotations

import random
from pathlib import Path

import numpy as np
import pandas as pd

POSES = [
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

LABELS = ["safe", "unsafe", "modify"]


def label_for_row(trimester: int, pose: str, has_hypertension: bool, has_diabetes: bool) -> str:
    supine_like = {"supine-twist", "bridge"}
    strong = {"warrior-1", "warrior-2", "downward-dog"}

    if trimester == 3 and pose in supine_like:
        return "unsafe"
    if trimester == 3 and pose == "downward-dog":
        return "modify"
    if trimester == 3 and pose in {"warrior-1", "warrior-2"}:
        return random.choice(["modify", "safe"])
    if has_hypertension and pose in {"bridge", "downward-dog", "warrior-1"}:
        return random.choice(["unsafe", "modify"])
    if has_diabetes and pose in {"bridge", "warrior-2"}:
        return random.choice(["modify", "safe"])
    if pose in {"pigeon", "seated-forward-bend"} and random.random() < 0.08:
        return "modify"
    return "safe"


def main() -> None:
    random.seed(42)
    np.random.seed(42)

    rows = []
    for _ in range(1000):
        trimester = int(np.random.choice([1, 2, 3], p=[0.25, 0.35, 0.4]))
        if trimester == 1:
            weeks = int(np.random.randint(1, 14))
        elif trimester == 2:
            weeks = int(np.random.randint(14, 28))
        else:
            weeks = int(np.random.randint(28, 41))

        age = int(np.random.randint(18, 44))
        bmi = float(np.random.uniform(17.5, 38.0))
        heart_rate = int(np.random.randint(55, 115))
        has_hypertension = bool(np.random.random() < 0.12)
        has_diabetes = bool(np.random.random() < 0.08)
        pose = random.choice(POSES)

        label = label_for_row(trimester, pose, has_hypertension, has_diabetes)
        rows.append(
            {
                "trimester": trimester,
                "weeks_pregnant": weeks,
                "age": age,
                "bmi": round(bmi, 2),
                "heart_rate": heart_rate,
                "has_hypertension": int(has_hypertension),
                "has_diabetes": int(has_diabetes),
                "pose_name": pose,
                "pose_label": label,
            }
        )

    df = pd.DataFrame(rows)
    out = Path(__file__).resolve().parents[1] / "data" / "synthetic_yoga_safety.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} rows to {out}")


if __name__ == "__main__":
    main()
