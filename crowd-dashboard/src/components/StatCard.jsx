export default function StatCard({ label, value, unit, delta, deltaLabel, loading, badge }) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = hasDelta && delta > 0;
  const down = hasDelta && delta < 0;

  return (
    <div className="card stat">
      <div className="stat-label">
        {label} {badge}
      </div>
      <div className="stat-value">
        {loading ? <span className="skeleton" /> : (<>{value}{unit && <span className="unit"> {unit}</span>}</>)}
      </div>
      {!loading && hasDelta && (
        <div className={`delta ${up ? "up" : down ? "down" : ""}`}>
          {up ? "▲" : down ? "▼" : "•"} {Math.abs(delta).toFixed(0)}% {deltaLabel || "vs yesterday"}
        </div>
      )}
    </div>
  );
}
