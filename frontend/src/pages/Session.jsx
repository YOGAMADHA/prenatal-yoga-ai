import { useMemo, useState } from "react";
import WebcamPoseDetector from "../components/WebcamPoseDetector";
import VideoPlayerModal from "../components/VideoPlayerModal";
import VideoCard from "../components/VideoCard";
import ChatUI from "../components/ChatUI";
import { useApp } from "../context/AppContext";
import { useRecommendations } from "../hooks/useRecommendations";

export default function Session() {
  const { trimester, userId, videos, setTrimester } = useApp();
  const { loadRecommendations } = useRecommendations();
  const [unsafe, setUnsafe] = useState(false);
  const [tip, setTip] = useState("");
  const [player, setPlayer] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const primary = useMemo(() => videos?.[0] || null, [videos]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {unsafe && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Safety alert: {tip || "Adjust your posture and slow down."}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-sage">Yoga session</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">
            Trimester
            <select
              className="ml-2 rounded-lg border px-2 py-1"
              value={trimester}
              onChange={(e) => setTrimester(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          <button
            type="button"
            className="rounded-xl bg-blush px-4 py-2 text-sm font-semibold text-white"
            onClick={() => loadRecommendations("any")}
          >
            Refresh videos
          </button>
          <button
            type="button"
            className="rounded-xl border border-sage px-4 py-2 text-sm font-semibold text-sage"
            onClick={() => setChatOpen(true)}
          >
            Chat
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <WebcamPoseDetector
          trimester={trimester}
          userId={userId}
          onSafetyChange={(u, t) => {
            setUnsafe(u);
            setTip(t);
          }}
        />
        <div>
          <div className="mb-3 font-semibold text-slate-800">Recommended video</div>
          {primary ? (
            <VideoCard video={primary} onPlay={setPlayer} />
          ) : (
            <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
              No recommendation loaded yet.
            </div>
          )}
        </div>
      </div>

      <VideoPlayerModal video={player} open={Boolean(player)} onClose={() => setPlayer(null)} />

      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-10 h-[70vh] max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="font-semibold">Assistant</div>
              <button type="button" className="text-sm underline" onClick={() => setChatOpen(false)}>
                Close
              </button>
            </div>
            <div className="h-[calc(70vh-52px)] p-3">
              {/* lazy import pattern would be nicer; inline ChatUI for simplicity */}
              <div className="h-full">
                <ChatUI trimester={trimester} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
