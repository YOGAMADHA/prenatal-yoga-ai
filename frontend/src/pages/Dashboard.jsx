import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import VideoCard from "../components/VideoCard";
import { useState } from "react";
import VideoPlayerModal from "../components/VideoPlayerModal";

export default function Dashboard() {
  const { trimester, profile, safePoses, videos, loading } = useApp();
  const [active, setActive] = useState(null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sage">Dashboard</h1>
          <p className="text-slate-600">Your personalized safety snapshot</p>
        </div>
        <div className="rounded-2xl bg-sage px-4 py-2 text-white">Trimester {trimester}</div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-sage/15 bg-white p-5">
          <div className="text-sm text-slate-600">Today’s session</div>
          <div className="mt-2 text-lg font-semibold">Gentle mobility + breath</div>
          <div className="mt-2 text-sm text-slate-600">Recommended duration: 12–18 minutes</div>
        </div>
        <div className="rounded-2xl border border-sage/15 bg-white p-5">
          <div className="text-sm text-slate-600">Safety score (demo)</div>
          <div className="mt-2 text-4xl font-bold text-sage">92</div>
          <div className="text-sm text-slate-600">Based on your latest profile</div>
        </div>
        <div className="rounded-2xl border border-sage/15 bg-white p-5">
          <div className="text-sm text-slate-600">Quick stats</div>
          <div className="mt-2 text-sm">Sessions done: 0</div>
          <div className="text-sm">Poses mastered: {safePoses.length}</div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-800">Recommended videos</h2>
          <Link className="text-sm font-semibold text-sage underline" to="/session">
            Start a session
          </Link>
        </div>
        {loading && <div className="mt-4 text-sm text-slate-600">Loading…</div>}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos?.length ? (
            videos.map((v) => <VideoCard key={v.video_id} video={v} onPlay={setActive} />)
          ) : (
            <div className="text-sm text-slate-600">
              No videos yet — complete onboarding or check API connectivity.
            </div>
          )}
        </div>
      </div>

      {profile && (
        <div className="mt-8 rounded-2xl border border-sage/15 bg-cream p-5 text-sm text-slate-700">
          <div className="font-semibold text-sage">Profile snapshot</div>
          <div className="mt-2">BMI: {profile.bmi?.toFixed?.(2) ?? "—"}</div>
          <div>Safe poses detected: {safePoses.join(", ") || "—"}</div>
        </div>
      )}

      <VideoPlayerModal video={active} open={Boolean(active)} onClose={() => setActive(null)} />
    </div>
  );
}
