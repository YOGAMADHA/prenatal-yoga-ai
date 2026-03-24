import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useHealthProfile } from "../hooks/useHealthProfile";
import { usePoseClassifier } from "../hooks/usePoseClassifier";
import { useRecommendations } from "../hooks/useRecommendations";
import { useApp } from "../context/AppContext";

const STEPS = ["Basics", "Vitals", "Conditions"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { loading, setLoading } = useApp();
  const { saveProfile } = useHealthProfile();
  const { classifyAll } = usePoseClassifier();
  const { loadRecommendations } = useRecommendations();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    trimester: 2,
    age: 30,
    weight_kg: 62,
    height_cm: 165,
    weeks_pregnant: 20,
    heart_rate: 78,
    medical_conditions: ["none"],
  });
  const [error, setError] = useState("");

  const bmiPreview = useMemo(() => {
    const h = form.height_cm / 100;
    return Number((form.weight_kg / (h * h)).toFixed(2));
  }, [form.height_cm, form.weight_kg]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const toggleCondition = (c) => {
    setForm((f) => {
      let conds = [...f.medical_conditions];
      if (c === "none") return { ...f, medical_conditions: ["none"] };
      conds = conds.filter((x) => x !== "none");
      if (conds.includes(c)) conds = conds.filter((x) => x !== c);
      else conds.push(c);
      if (!conds.length) conds = ["none"];
      return { ...f, medical_conditions: conds };
    });
  };

  const finish = async () => {
    setError("");
    setLoading(true);
    try {
      const merged = await saveProfile(form);
      const { safePoses: safe } = await classifyAll(merged);
      await loadRecommendations("any", safe);
      navigate("/dashboard");
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sage">Health onboarding</h1>
          <Link className="text-sm text-slate-600 underline" to="/">
            Home
          </Link>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream">
          <div className="h-full bg-sage transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Step {step + 1}/{STEPS.length}: {STEPS[step]}
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <div className="rounded-2xl border border-sage/15 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Trimester
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.trimester}
                onChange={(e) => setForm({ ...form, trimester: Number(e.target.value) })}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <label className="text-sm">
              Weeks pregnant
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.weeks_pregnant}
                onChange={(e) => setForm({ ...form, weeks_pregnant: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Age
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Weight (kg)
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Height (cm)
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Heart rate (bpm)
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.heart_rate}
                onChange={(e) => setForm({ ...form, heart_rate: Number(e.target.value) })}
              />
            </label>
            <div className="rounded-xl bg-cream p-4 text-sm">
              <div className="font-semibold text-sage">BMI (auto)</div>
              <div className="text-2xl font-bold">{bmiPreview}</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-sm font-semibold text-slate-700">Medical conditions</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["hypertension", "diabetes", "back_pain", "none"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    form.medical_conditions.includes(c)
                      ? "border-sage bg-sage text-white"
                      : "border-sage/30 bg-white text-slate-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button type="button" className="rounded-xl border px-4 py-2" onClick={prev} disabled={step === 0}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="rounded-xl bg-sage px-4 py-2 text-white" onClick={next}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="rounded-xl bg-sage px-4 py-2 text-white disabled:opacity-50"
              onClick={finish}
              disabled={loading}
            >
              {loading ? "Saving & analyzing…" : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
