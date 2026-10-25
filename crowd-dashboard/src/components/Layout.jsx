import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><span className="logo small">◎</span> Crowd Management</div>
        <nav>
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/entries">Crowd Entries</NavLink>
        </nav>
        <button className="ghost" onClick={() => { logout(); navigate("/login", { replace: true }); }}>
          Log out
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
