import axios from "axios";

export const API_BASE = (import.meta.env.VITE_API_BASE || "https://hiring-dev.internal.kloudspot.com").replace(/\/$/, "");

const TOKEN_KEY = "cms_token";

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach JWT to every request. The token is never logged.
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 (expired / invalid token) clear the session and return to login.
client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && !String(error.config?.url || "").includes("/auth/login")) {
      tokenStore.clear();
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err, fallback = "Something went wrong") {
  const d = err?.response?.data;
  if (typeof d === "string" && d) return d;
  return d?.message || d?.error || err?.message || fallback;
}

export default client;
