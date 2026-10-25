import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const MAX_ALERTS = 50;

const pickCount = (p) => {
  if (typeof p === "number") return p;
  if (!p || typeof p !== "object") return null;
  for (const k of ["occupancy", "count", "total", "liveOccupancy", "value", "current"]) {
    if (typeof p[k] === "number") return p[k];
  }
  return null;
};

/**
 * Connects to the Socket.IO server with the JWT and exposes:
 *  - alerts:   latest `alert` events (entry/exit, zone, site, severity)
 *  - live:     latest live occupancy payload (+ numeric count when found)
 *  - connected: socket connection state
 *
 * Event names follow the brief ("alert", "live occupancy"). Several spellings of the
 * live-occupancy event are accepted so a naming difference in Swagger doesn't break the UI.
 */
export function useSocket(siteId) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [live, setLive] = useState(null);
  const siteRef = useRef(siteId);
  siteRef.current = siteId;

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(API_BASE, {
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    const onAlert = (payload) => {
      setAlerts((prev) =>
        [{ ...(typeof payload === "object" && payload ? payload : { message: String(payload) }), _id: `${Date.now()}-${Math.random()}`, _at: Date.now() }, ...prev].slice(0, MAX_ALERTS)
      );
    };

    const onLive = (payload) => {
      setLive({ payload, count: pickCount(payload), at: Date.now() });
    };

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("alert", onAlert);
    ["live_occupancy", "liveOccupancy", "live-occupancy", "occupancy", "live occupancy"].forEach((e) => socket.on(e, onLive));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [token]);

  return { connected, alerts, live };
}
