import { useCallback } from "react";
import { classifyPose } from "../api/client";
import { useApp } from "../context/AppContext";

const ALL_POSES = [
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
];

export function usePoseClassifier() {
  const { profile, setSafePoses } = useApp();

  const classifyAll = useCallback(
    async (explicitProfile) => {
      const p = explicitProfile || profile;
      if (!p) throw new Error("Profile required");
      const bmi = p.bmi ?? p.weight_kg / (p.height_cm / 100) ** 2;

      const tasks = ALL_POSES.map((pose_name) =>
        classifyPose({
          user_id: p.user_id,
          trimester: p.trimester,
          weeks_pregnant: p.weeks_pregnant,
          age: p.age,
          bmi: Number(bmi.toFixed(2)),
          heart_rate: p.heart_rate,
          has_hypertension: p.medical_conditions?.includes("hypertension") ?? false,
          has_diabetes: p.medical_conditions?.includes("diabetes") ?? false,
          pose_name,
        })
      );

      const results = await Promise.all(tasks);
      const safe = ALL_POSES.filter((_, i) => results[i].pose_label === "safe");
      setSafePoses(safe);
      return { results, safePoses: safe };
    },
    [profile, setSafePoses]
  );

  return { classifyAll, ALL_POSES };
}
