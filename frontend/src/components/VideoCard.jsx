export default function VideoCard({ video, onPlay }) {
  const badge = `Safe for trimester${video.trimester_safe?.length > 1 ? "s" : ""}: ${video.trimester_safe?.join(", ")}`;
  const yt = video.youtube_url || "";

  return (
    <div className="w-full rounded-xl border border-sage/15 bg-white p-3 text-left shadow-sm transition hover:shadow-md">
      <button type="button" onClick={() => onPlay?.(video)} className="w-full text-left">
        <div className="overflow-hidden rounded-lg">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-800">{video.title}</div>
            <div className="text-xs text-slate-500">{video.pose_name}</div>
          </div>
          <div className="rounded-full bg-cream px-2 py-1 text-xs text-sage">{video.duration_minutes} min</div>
        </div>
        <div className="mt-2 inline-flex rounded-full bg-sage/10 px-2 py-1 text-xs text-sage">{badge}</div>
        <div className="mt-2 line-clamp-2 text-sm text-slate-600">{video.description}</div>
      </button>

      {yt && (
        <a
          href={yt}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          onClick={(e) => e.stopPropagation()}
        >
          <span aria-hidden>▶</span>
          Open on YouTube
        </a>
      )}
    </div>
  );
}
