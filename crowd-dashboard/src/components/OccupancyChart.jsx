import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtHour } from "../utils/time";

export default function OccupancyChart({ data }) {
  if (!data.length) return <div className="empty">No occupancy data for this period.</div>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f6bed" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4f6bed" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f2" />
        <XAxis dataKey="t" tickFormatter={fmtHour} tick={{ fontSize: 12 }} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} formatter={(v) => [v, "Avg. occupancy"]} />
        <Area type="monotone" dataKey="value" stroke="#4f6bed" strokeWidth={2} fill="url(#occ)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
