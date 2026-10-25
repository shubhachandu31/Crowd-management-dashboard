import client from "./client";
import {
  extractMetric,
  extractSites,
  extractToken,
  normalizeDemographics,
  normalizeEntries,
  normalizeOccupancy,
} from "../utils/normalize";

// ---- Auth ----
export async function login(email, password) {
  const { data } = await client.post("/api/auth/login", { email, password });
  const token = extractToken(data);
  if (!token) throw new Error("Login succeeded but no token was returned");
  return token;
}

// ---- Sites ----
export async function fetchSites() {
  const { data } = await client.get("/api/sites");
  return extractSites(data);
}

// ---- Analytics (all POST; fromUtc/toUtc are epoch-millis) ----
const range = (siteId, fromUtc, toUtc) => ({ siteId, fromUtc, toUtc });

export async function fetchFootfall(siteId, fromUtc, toUtc) {
  const { data } = await client.post("/api/analytics/footfall", range(siteId, fromUtc, toUtc));
  return extractMetric(data, ["footfall", "count", "total", "totalEntries", "value"]);
}

export async function fetchDwell(siteId, fromUtc, toUtc) {
  const { data } = await client.post("/api/analytics/dwell", range(siteId, fromUtc, toUtc));
  return extractMetric(data, ["avgDwellMinutes", "averageDwellMinutes", "dwellMinutes", "avgDwell", "dwell", "average", "value"]);
}

export async function fetchOccupancy(siteId, fromUtc, toUtc) {
  const { data } = await client.post("/api/analytics/occupancy", range(siteId, fromUtc, toUtc));
  return normalizeOccupancy(data);
}

export async function fetchDemographics(siteId, fromUtc, toUtc) {
  const { data } = await client.post("/api/analytics/demographics", range(siteId, fromUtc, toUtc));
  return normalizeDemographics(data);
}

export async function fetchEntries(siteId, fromUtc, toUtc, page, pageSize) {
  const { data } = await client.post("/api/analytics/entry-exit", {
    ...range(siteId, fromUtc, toUtc),
    page,
    pageSize,
    limit: pageSize, // sent in both forms; the backend uses whichever it defines in Swagger
  });
  return normalizeEntries(data);
}

// ---- Simulation (optional controls) ----
export const startSimulation = () => client.get("/api/sim/start");
export const stopSimulation = () => client.get("/api/sim/stop");
