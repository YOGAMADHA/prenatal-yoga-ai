export default function FilterBar({ trimester, setTrimester, intensity, setIntensity }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sage/15 bg-white p-3">
      <label className="text-sm font-semibold text-slate-700">
        Trimester
        <select
          className="ml-2 rounded-lg border border-sage/30 px-2 py-1"
          value={trimester}
          onChange={(e) => setTrimester(Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Intensity
        <select
          className="ml-2 rounded-lg border border-sage/30 px-2 py-1"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value)}
        >
          <option value="any">any</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
        </select>
      </label>
    </div>
  );
}
