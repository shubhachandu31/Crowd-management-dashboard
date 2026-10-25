// All API times are UTC epoch-millis.

export function startOfTodayMs(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfYesterdayMs(now = new Date()) {
  return startOfTodayMs(now) - 24 * 60 * 60 * 1000;
}

export function fmtDateTime(ms) {
  if (ms === null || ms === undefined || ms === "") return "—";
  const d = new Date(typeof ms === "string" && /^\d+$/.test(ms) ? Number(ms) : ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtHour(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtMinutes(min) {
  if (min === null || min === undefined || Number.isNaN(Number(min))) return "—";
  const m = Math.round(Number(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
