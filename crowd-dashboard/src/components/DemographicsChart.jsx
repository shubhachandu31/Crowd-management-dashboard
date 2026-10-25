import { Cell, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtHour } from "../utils/time";

const MALE = "#4f6bed";
const FEMALE = "#e8638b";

export default function DemographicsChart({ data }) {
  if (!data.length) return <div className="empty">No demographics data for this period.</div>;

  const totals = data.reduce((a, r) => ({ male: a.male + r.male, female: a.female + r.female }), { male: 0, female: 0 });
  const pie = [
    { name: "Male", value: totals.male, color: MALE },
    { name: "Female", value: totals.female, color: FEMALE },
  ];
  const sum = totals.male + totals.female || 1;

  return (
    <div className="demo-grid">
      <div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f2" />
            <XAxis dataKey="t" tickFormatter={fmtHour} tick={{ fontSize: 12 }} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="male" name="Male" stroke={MALE} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="female" name="Female" stroke={FEMALE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="pie-wrap">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <ul className="legend">
          {pie.map((p) => (
            <li key={p.name}>
              <span className="dot" style={{ background: p.color }} />
              {p.name}: <strong>{p.value}</strong> ({Math.round((p.value / sum) * 100)}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
