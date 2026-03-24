import { useCallback } from "react";
import { recommendVideos } from "../api/client";
import { useApp } from "../context/AppContext";

export function useRecommendations() {
  const { trimester, safePoses, setVideos } = useApp();

  const load = useCallback(
    async (intensityPreference = "any", safePosesOverride) => {
      const poses = safePosesOverride ?? safePoses;
      const { recommendations } = await recommendVideos({
        trimester,
        safe_poses: poses,
        intensity_preference: intensityPreference,
      });
      setVideos(recommendations);
      return recommendations;
    },
    [trimester, safePoses, setVideos]
  );

  return { loadRecommendations: load };
}
