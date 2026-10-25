# Crowd Management System – Frontend

Responsive single-page dashboard for the Kloudspot Crowd Management System.

**Features**
- Login (email + password with show/hide toggle, inline error on failure, JWT session)
- Protected routes (Overview, Crowd Entries) – redirect to `/login` when unauthenticated; auto-logout on `401`
- Overview: Live Occupancy, Today's Footfall, Average Dwell Time (with % vs yesterday), occupancy time-series, demographics (male vs female line chart + pie)
- Real-time **Socket.IO** alerts (entry/exit, zone, site, severity) and live occupancy updates
- Crowd Entries: paginated visitor table (name, gender, entry, exit, dwell)

**Stack:** React 18 · Vite · React Router · Axios · Recharts · socket.io-client

## Run locally

```bash
npm install
cp .env.example .env     # API base URL
npm run dev              # http://localhost:5173
```

Test accounts: `test@test.com` / `1234567890` · `dummy@example.com` / `1234567890`

> If the dashboard is empty, call `GET /api/sim/start` (Swagger → Simulation) once so the backend generates live data.

## Environment

| Variable | Default |
| --- | --- |
| `VITE_API_BASE` | `https://hiring-dev.internal.kloudspot.com` |

## Project structure

```
src/
  api/          axios client (JWT interceptor) + analytics endpoints
  auth/         AuthContext, ProtectedRoute
  hooks/        useSocket (Socket.IO)
  utils/        time helpers, defensive response normalizers
  components/   Layout, StatCard, OccupancyChart, DemographicsChart, AlertsPanel
  pages/        Login, Dashboard, Entries
```

## Deploy

**Vercel** – import the GitHub repo, framework preset *Vite*, build `npm run build`, output `dist`, add env var `VITE_API_BASE`. `vercel.json` handles SPA routing.

**Netlify** – build `npm run build`, publish `dist`. `public/_redirects` handles SPA routing.

## Notes
- All times are sent to the API as UTC epoch-millis (`fromUtc`, `toUtc`).
- Tokens are never logged.
- Response parsing is tolerant of small field-name differences; adjust `src/utils/normalize.js` if Swagger uses different names.
