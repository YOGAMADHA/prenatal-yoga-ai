import { useCallback } from "react";
import { submitProfile } from "../api/client";
import { useApp } from "../context/AppContext";

export function useHealthProfile() {
  const { userId, setUserId, setProfile, setTrimester, setLoading } = useApp();

  const saveProfile = useCallback(
    async (form) => {
      if (!userId) {
        throw new Error("You must be logged in to save your profile.");
      }
      setLoading(true);
      try {
        const payload = {
          user_id: userId,
          trimester: form.trimester,
          age: form.age,
          weight_kg: form.weight_kg,
          height_cm: form.height_cm,
          medical_conditions: form.medical_conditions,
          heart_rate: form.heart_rate,
          weeks_pregnant: form.weeks_pregnant,
        };

        const res = await submitProfile(payload);
        setTrimester(form.trimester);
        const merged = {
          user_id: userId,
          ...form,
          bmi: res.bmi,
          preprocessed: res.preprocessed_feature_vector,
        };
        setProfile(merged);
        return merged;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setProfile, setTrimester, userId]
  );

  return { saveProfile };
}
