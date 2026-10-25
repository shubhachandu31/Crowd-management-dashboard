import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { errorMessage } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      setError(status === 401 || status === 400 ? "Invalid email or password." : errorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="logo">◎</div>
        <h1>Welcome to the Crowd Management System</h1>
        <p>Live occupancy, footfall, dwell time and visitor insights in one place.</p>
      </div>

      <form className="card login-card" onSubmit={onSubmit} noValidate>
        <h2>Sign in</h2>

        <label htmlFor="email">Email / Login ID</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <div className="password-wrap">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="ghost" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? "Hide" : "Show"}
          </button>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
