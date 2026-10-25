import { useEffect, useState } from "react";
import { fetchEntries, fetchSites } from "../api/analytics";
import { errorMessage } from "../api/client";
import { fmtDateTime, fmtMinutes, startOfTodayMs } from "../utils/time";

const PAGE_SIZE = 10;

export default function Entries() {
  const [siteId, setSiteId] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ rows: [], total: undefined, totalPages: undefined });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSites()
      .then((s) => (s.length ? setSiteId(String(s[0].id)) : (setError("No sites available."), setLoading(false))))
      .catch((e) => { setError(errorMessage(e, "Could not load sites.")); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!siteId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchEntries(siteId, startOfTodayMs(), Date.now(), page, PAGE_SIZE)
      .then((r) => { if (!cancelled) setResult(r); })
      .catch((e) => { if (!cancelled) setError(errorMessage(e, "Could not load entries.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [siteId, page]);

  const { rows, total, totalPages } = result;
  const pages = totalPages ?? (total !== undefined ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : undefined);
  const hasNext = pages !== undefined ? page < pages : rows.length === PAGE_SIZE;

  return (
    <div className="page">
      <div className="page-head">
        <h2>Crowd Entries</h2>
        <span className="muted">Today's visitor entry / exit records</span>
      </div>

      {error && <div className="error banner" role="alert">{error}</div>}

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Gender</th>
                <th>Entry time</th>
                <th>Exit time</th>
                <th>Dwell time</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`s${i}`}>{Array.from({ length: 5 }).map((__, j) => <td key={j}><span className="skeleton" /></td>)}</tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="empty">No entries found.</td></tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.gender}</td>
                  <td>{fmtDateTime(r.entry)}</td>
                  <td>{r.exit ? fmtDateTime(r.exit) : <span className="pill ok">Inside</span>}</td>
                  <td>{fmtMinutes(r.dwell)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button className="ghost" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>← Previous</button>
          <span className="muted">
            Page {page}{pages ? ` of ${pages}` : ""}{total !== undefined ? ` · ${total} records` : ""}
          </span>
          <button className="ghost" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
