// The backend contract is defined in Swagger. These helpers read the response
// defensively so small naming differences (e.g. `avg` vs `average`) don't break the UI.

export function firstDefined(obj, keys, fallback = undefined) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

export function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Find the first array inside a response (res itself, or res.data / res.items / ...)
export function extractArray(res, extraKeys = []) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  const keys = [...extraKeys, "data", "items", "records", "rows", "results", "buckets", "list", "entries"];
  for (const k of keys) {
    if (Array.isArray(res[k])) return res[k];
  }
  for (const k of keys) {
    if (res[k] && typeof res[k] === "object") {
      const inner = extractArray(res[k], extraKeys);
      if (inner.length) return inner;
    }
  }
  return [];
}

// Single-number metrics (footfall, dwell)
export function extractMetric(res, keys) {
  if (typeof res === "number") return res;
  if (!res || typeof res !== "object") return 0;
  const direct = firstDefined(res, keys);
  if (direct !== undefined) return toNumber(direct);
  if (res.data !== undefined) return extractMetric(res.data, keys);
  return 0;
}

const TIME_KEYS = ["fromUtc", "hourUtc", "bucketStart", "hour", "time", "timestamp", "ts", "bucket", "utc", "date", "from"];

function toMs(v) {
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const n = Number(v);
  if (Number.isFinite(n) && String(v).trim() !== "") return n < 1e12 ? n * 1000 : n;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

export function normalizeOccupancy(res) {
  return extractArray(res, ["occupancy", "series", "hourly"])
    .map((r) => {
      const t = toMs(firstDefined(r, TIME_KEYS));
      const v = toNumber(
        firstDefined(r, ["avg", "average", "avgOccupancy", "occupancy", "count", "value", "total"], 0)
      );
      return t === null ? null : { t, value: Math.round(v * 10) / 10 };
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);
}

export function normalizeDemographics(res) {
  return extractArray(res, ["demographics", "series", "hourly"])
    .map((r) => {
      const t = toMs(firstDefined(r, TIME_KEYS));
      const male = toNumber(firstDefined(r, ["male", "maleCount", "males", "M"], 0));
      const female = toNumber(firstDefined(r, ["female", "femaleCount", "females", "F"], 0));
      return t === null ? null : { t, male, female };
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);
}

export function normalizeEntries(res) {
  const rows = extractArray(res, ["entries", "sessions", "logs"]).map((r, i) => {
    const entry = firstDefined(r, ["entryUtc", "entryTime", "entryAt", "entry", "inTime", "entryTs", "entered"]);
    const exit = firstDefined(r, ["exitUtc", "exitTime", "exitAt", "exit", "outTime", "exitTs", "exited"]);
    let dwell = firstDefined(r, ["dwellMinutes", "dwellTime", "dwell", "dwellDuration", "durationMinutes"]);
    if (dwell === undefined && entry && exit) {
      const a = toMs(entry);
      const b = toMs(exit);
      if (a && b && b >= a) dwell = (b - a) / 60000;
    }
    return {
      id: firstDefined(r, ["id", "_id", "sessionId", "personId", "visitorId"], i),
      name: firstDefined(r, ["name", "visitorName", "personName", "fullName", "visitor", "personId"], "Unknown"),
      gender: firstDefined(r, ["gender", "sex"], "—"),
      entry: entry !== undefined ? toMs(entry) : null,
      exit: exit !== undefined && exit !== null && exit !== "" ? toMs(exit) : null,
      dwell: dwell !== undefined ? toNumber(dwell, null) : null,
    };
  });

  const total = res && typeof res === "object"
    ? firstDefined(res, ["total", "totalCount", "totalRecords", "count", "totalItems"], undefined) ??
      firstDefined(res.pagination || res.meta || res.data || {}, ["total", "totalCount", "totalRecords", "totalItems"], undefined)
    : undefined;
  const totalPages = res && typeof res === "object"
    ? firstDefined(res, ["totalPages", "pages"], undefined) ??
      firstDefined(res.pagination || res.meta || res.data || {}, ["totalPages", "pages"], undefined)
    : undefined;

  return { rows, total: total !== undefined ? toNumber(total) : undefined, totalPages: totalPages !== undefined ? toNumber(totalPages) : undefined };
}

export function extractSites(res) {
  return extractArray(res, ["sites"]).map((s) => ({
    id: firstDefined(s, ["id", "_id", "siteId"]),
    name: firstDefined(s, ["name", "siteName", "title"], "Site"),
  })).filter((s) => s.id !== undefined);
}

export function extractToken(res) {
  if (!res || typeof res !== "object") return null;
  return (
    firstDefined(res, ["token", "accessToken", "access_token", "jwt", "idToken"]) ||
    (res.data ? extractToken(res.data) : null)
  );
}
