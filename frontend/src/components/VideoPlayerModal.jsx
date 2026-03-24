import ReactPlayer from "react-player";

export default function VideoPlayerModal({ video, open, onClose }) {
  if (!open || !video) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold">{video.title}</div>
            <div className="text-sm text-slate-600">{video.pose_name}</div>
          </div>
          <button
            type="button"
            className="rounded-lg border px-3 py-1 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <ReactPlayer url={video.youtube_url} width="100%" height="100%" controls playing />
        </div>
      </div>
    </div>
  );
}
