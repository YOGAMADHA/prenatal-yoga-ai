import { useApp } from "../context/AppContext";

export default function Profile() {
  const { profile, trimester, safePoses, userId } = useApp();
  const pct = Math.min(100, Math.round((trimester / 3) * 100));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold text-sage">Profile</h1>
      <div className="mt-6 rounded-2xl border border-sage/15 bg-white p-6">
        <div className="text-sm text-slate-600">User ID</div>
        <div className="text-lg font-semibold">{userId ?? "—"}</div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-700">Pregnancy timeline</div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-cream">
            <div className="h-full bg-sage" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-sm text-slate-600">Trimester {trimester}</div>
        </div>

        {profile && (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-cream p-4 text-sm">
              <div className="font-semibold text-sage">Vitals</div>
              <div>Age: {profile.age}</div>
              <div>Weeks: {profile.weeks_pregnant}</div>
              <div>BMI: {profile.bmi?.toFixed?.(2) ?? "—"}</div>
              <div>HR: {profile.heart_rate}</div>
            </div>
            <div className="rounded-xl bg-cream p-4 text-sm">
              <div className="font-semibold text-sage">Conditions</div>
              <div>{(profile.medical_conditions || []).join(", ")}</div>
              <div className="mt-3 font-semibold text-sage">Classifier: safe poses</div>
              <div>{safePoses.join(", ") || "—"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-sage/15 bg-white p-6">
        <div className="font-semibold text-slate-800">Session history</div>
        <div className="mt-2 text-sm text-slate-600">No sessions logged yet (demo).</div>
      </div>
    </div>
  );
}
