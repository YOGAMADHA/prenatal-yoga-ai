import { useMemo, useState } from "react";
import { submitProfile } from "../api/client";
import { useApp } from "../context/AppContext";

const CONDITIONS = [
  { id: "hypertension", label: "Hypertension" },
  { id: "diabetes", label: "Diabetes" },
  { id: "back_pain", label: "Back pain" },
  { id: "none", label: "None" },
];

export default function HealthProfileForm({ onSaved }) {
  const { userId } = useApp();
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
  const [busy, setBusy] = useState(false);

  const bmi = useMemo(() => {
    const h = form.height_cm / 100;
    return Number((form.weight_kg / (h * h)).toFixed(2));
  }, [form.height_cm, form.weight_kg]);

  const toggleCondition = (id) => {
    setForm((f) => {
      let c = [...f.medical_conditions];
      if (id === "none") return { ...f, medical_conditions: ["none"] };
      c = c.filter((x) => x !== "none");
      if (c.includes(id)) c = c.filter((x) => x !== id);
      else c.push(id);
      if (!c.length) c = ["none"];
      return { ...f, medical_conditions: c };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Please log in to save your profile.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await submitProfile({
        user_id: userId,
        ...form,
      });
      onSaved?.({ user_id: userId, ...form, bmi: res.bmi, preprocessed: res.preprocessed_feature_vector });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail || err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-sage/15 bg-white p-6">
      <div className="text-xl font-bold text-sage">Maternal health profile</div>
      {!userId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Log in to save your profile to your account.
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Trimester
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.trimester}
            required
            onChange={(e) => setForm({ ...form, trimester: Number(e.target.value) })}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label className="text-sm">
          Weeks pregnant (1–42)
          <input
            type="number"
            min={1}
            max={42}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.weeks_pregnant}
            required
            onChange={(e) => setForm({ ...form, weeks_pregnant: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Age (16–55)
          <input
            type="number"
            min={16}
            max={55}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.age}
            required
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Heart rate (40–180)
          <input
            type="number"
            min={40}
            max={180}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.heart_rate}
            required
            onChange={(e) => setForm({ ...form, heart_rate: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Weight kg (35–150)
          <input
            type="number"
            min={35}
            max={150}
            step="0.1"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.weight_kg}
            required
            onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Height cm (130–210)
          <input
            type="number"
            min={130}
            max={210}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.height_cm}
            required
            onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })}
          />
        </label>
      </div>

      <div>
        <div className="text-sm font-semibold text-slate-700">Medical conditions</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCondition(c.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                form.medical_conditions.includes(c.id)
                  ? "border-sage bg-sage text-white"
                  : "border-sage/30 bg-white text-slate-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-cream p-4 text-sm">
        <div className="font-semibold text-sage">BMI (auto-calculated)</div>
        <div className="text-2xl font-bold">{bmi}</div>
      </div>

      <button
        type="submit"
        disabled={busy || !userId}
        className="w-full rounded-xl bg-sage py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
