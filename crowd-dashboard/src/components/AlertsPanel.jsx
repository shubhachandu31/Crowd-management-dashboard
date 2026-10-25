import { firstDefined } from "../utils/normalize";

function describe(a) {
  const action = String(firstDefined(a, ["action", "type", "event", "eventType"], "activity")).toLowerCase();
  const zone = firstDefined(a, ["zone", "zoneName", "zoneId", "floor"], null);
  const site = firstDefined(a, ["site", "siteName", "siteId"], null);
  const severity = String(firstDefined(a, ["severity", "level", "priority"], "info")).toLowerCase();
  const message = firstDefined(a, ["message", "msg", "description"], null);
  const obj = (v) => (v && typeof v === "object" ? firstDefined(v, ["name", "id"], JSON.stringify(v)) : v);
  return { action, zone: obj(zone), site: obj(site), severity, message };
}

export default function AlertsPanel({ alerts, connected }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Live alerts</h3>
        <span className={`pill ${connected ? "ok" : "off"}`}>{connected ? "Live" : "Reconnecting…"}</span>
      </div>
      {alerts.length === 0 ? (
        <div className="empty">Waiting for entry / exit events…</div>
      ) : (
        <ul className="alerts">
          {alerts.map((a) => {
            const d = describe(a);
            return (
              <li key={a._id} className={`alert ${d.severity}`}>
                <div className="alert-top">
                  <strong>{d.action.toUpperCase()}</strong>
                  <span className={`sev ${d.severity}`}>{d.severity}</span>
                </div>
                <div className="alert-sub">
                  {d.message || [d.zone && `Zone: ${d.zone}`, d.site && `Site: ${d.site}`].filter(Boolean).join(" · ") || "New movement detected"}
                </div>
                <div className="alert-time">{new Date(a._at).toLocaleTimeString()}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
