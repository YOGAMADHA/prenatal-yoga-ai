"""Create data/yoga_videos.csv with 50 rows and real YouTube watch URLs."""

from __future__ import annotations

import csv
import random
from pathlib import Path

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

TITLES = [
    "Gentle {pose} for stability",
    "Calm {pose} flow",
    "Supported {pose} practice",
    "Breath-led {pose}",
    "Slow {pose} with props",
]

# Real prenatal / pregnancy yoga videos (public YouTube). IDs rotated across 50 rows.
YOUTUBE_VIDEO_IDS = [
    "_GFkKV9MCyk",  # Lauren Eckstrom — second trimester flow (includes cat-cow, warrior)
    "tsLuz2i3ViQ",  # Yoga with Uliana — gentle in bed, all trimesters
    "MhS0VEeuB5I",  # Slow Down With Kiersten — prenatal cleanse series
    "lEftxA0enXI",  # Jackelyn Ho — first trimester gentle flow
    "IIeIf0CgHvE",  # Yoga with Yana — round ligament / hips, all trimesters
    "IG2Oc0jE0xo",  # Pregnancy and Postpartum TV — first trimester nausea relief
    "2dDJbfzo2sc",  # Studio PregActive — second trimester flow
    "wgLQdJXd_Yc",  # Lynn Goldstrohm — first trimester routine
    "4NwQKXpWN_A",  # SarahBethYoga — 10 min prenatal beginners, all trimesters
]


def trimester_safe_for(pose: str) -> list[int]:
    if pose in {"supine-twist", "bridge"}:
        return [1, 2]
    return [1, 2, 3]


def youtube_watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def youtube_thumb_url(video_id: str) -> str:
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"


def main() -> None:
    random.seed(7)
    rows = []
    for i in range(1, 51):
        pose = random.choice(POSES)
        intensity = random.choice(["low", "medium"])
        title = random.choice(TITLES).format(pose=pose.replace("-", " ").title())
        tsafe = trimester_safe_for(pose)
        vid = f"v{i:03d}"
        yid = YOUTUBE_VIDEO_IDS[(i - 1) % len(YOUTUBE_VIDEO_IDS)]
        rows.append(
            {
                "video_id": vid,
                "title": title,
                "pose_name": pose,
                "trimester_safe": str(tsafe),
                "intensity": intensity,
                "duration_minutes": random.choice([8, 10, 12, 15, 18, 20]),
                "description": f"A {intensity} prenatal session focusing on {pose.replace('-', ' ')} alignment and breath.",
                "youtube_url": youtube_watch_url(yid),
                "thumbnail_url": youtube_thumb_url(yid),
            }
        )

    out = Path(__file__).resolve().parents[1] / "data" / "yoga_videos.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "video_id",
        "title",
        "pose_name",
        "trimester_safe",
        "intensity",
        "duration_minutes",
        "description",
        "youtube_url",
        "thumbnail_url",
    ]
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
