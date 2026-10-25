import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchDemographics,
  fetchDwell,
  fetchFootfall,
  fetchOccupancy,
  fetchSites,
} from "../api/analytics";
import { errorMessage } from "../api/client";
import StatCard from "../components/StatCard";
import OccupancyChart from "../components/OccupancyChart";
import DemographicsChart from "../components/DemographicsChart";
import AlertsPanel from "../components/AlertsPanel";
import { useSocket } from "../hooks/useSocket";
import { fmtMinutes, startOfTodayMs } from "../utils/time";

const DAY = 24 * 60 * 60 * 1000;
const REFRESH_MS = 60_000;

const pct = (now, prev) => (prev ? ((now - prev) / prev) * 100 : undefined);
const ok = (r) => (r.status === "fulfilled" ? r.value : undefined);

export default function Dashboard() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { connected, alerts, live } = useSocket(siteId);

  // 1) Load sites once; default to the first one.
  useEffect(() => {
    let cancelled = false;
    fetchSites()
      .then((s) => {
        if (cancelled) return;
        setSites(s);
        if (s.length) setSiteId(String(s[0].id));
        else { setError("No sites available for this account."); setLoading(false); }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e, "Could not load sites."));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // 2) Load analytics for the selected site (today + yesterday for comparison).
  const load = useCallback(async (silent = false) => {
    if (!siteId) return;
    if (!silent) setLoading(true);
    const now = Date.now();
    const from = startOfTodayMs();
    const yFrom = from - DAY;
    const yTo = now - DAY; // same time of day yesterday, for a fair comparison

    const results = await Promise.allSettled([
      fetchFootfall(siteId, from, now),
      fetchFootfall(siteId, yFrom, yTo),
      fetchDwell(siteId, from, now),
      fetchDwell(siteId, yFrom, yTo),
      fetchOccupancy(siteId, from, now),
      fetchOccupancy(siteId, yFrom, yTo),
      fetchDemographics(siteId, from, now),
    ]);

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length === results.length) {
      setError(errorMessage(failed[0].reason, "Could not load analytics."));
    } else {
      setError(failed.length ? "Some metrics could not be loaded." : "");
    }

    setData({
      footfall: ok(results[0]),
      footfallPrev: ok(results[1]),
      dwell: ok(results[2]),
      dwellPrev: ok(results[3]),
      occupancy: ok(results[4]) || [],
      occupancyPrev: ok(results[5]) || [],
      demographics: ok(results[6]) || [],
    });
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Live occupancy: prefer the Socket.IO value, otherwise the latest hourly bucket.
  const liveOccupancy = useMemo(() => {
    if (live && typeof live.count === "number") return live.count;
    const last = data?.occupancy?.[data.occupancy.length - 1];
    return last ? Math.round(last.value) : 0;
  }, [live, data]);

  const occupancyDelta = useMemo(() => {
    const prev = data?.occupancyPrev;
    if (!prev?.length) return undefined;
    const target = Date.now() - DAY;
    const nearest = prev.reduce((b, p) => (Math.abs(p.t - target) < Math.abs(b.t - target) ? p : b), prev[0]);
    return pct(liveOccupancy, nearest.value);
  }, [data, liveOccupancy]);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Overview</h2>
        {sites.length > 1 && (
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} aria-label="Select site">
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {sites.length === 1 && <span className="muted">{sites[0].name}</span>}
      </div>

      {error && <div className="error banner" role="alert">{error}</div>}

      <section className="stats">
        <StatCard
          label="Live Occupancy"
          value={liveOccupancy}
          delta={occupancyDelta}
          loading={loading}
          badge={<span className={`dot-live ${connected ? "on" : ""}`} title={connected ? "Live" : "Offline"} />}
        />
        <StatCard
          label="Today's Footfall"
          value={data?.footfall ?? 0}
          delta={pct(data?.footfall ?? 0, data?.footfallPrev ?? 0)}
          loading={loading}
        />
        <StatCard
          label="Avg. Dwell Time"
          value={fmtMinutes(data?.dwell)}
          delta={pct(data?.dwell ?? 0, data?.dwellPrev ?? 0)}
          loading={loading}
        />
      </section>

      <section className="grid">
        <div className="card span-2">
          <div className="card-head"><h3>Occupancy over time</h3><span className="muted">Today · hourly average</span></div>
          {loading ? <div className="skeleton block" /> : <OccupancyChart data={data?.occupancy || []} />}
        </div>
        <AlertsPanel alerts={alerts} connected={connected} />
        <div className="card span-3">
          <div className="card-head"><h3>Demographics</h3><span className="muted">Male vs Female · today</span></div>
          {loading ? <div className="skeleton block" /> : <DemographicsChart data={data?.demographics || []} />}
        </div>
      </section>
    </div>
  );
}
