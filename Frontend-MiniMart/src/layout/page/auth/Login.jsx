import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ROLE_DEFAULT_ROUTE } from "../../../config/permissions";
import "./login.css";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      const result = await login({
        username: username.trim(),
        password: password.trim(),
      });
      const role = result?.user?.role;
      const target = ROLE_DEFAULT_ROUTE[role] ?? "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <h1 className="login-title">Welcome Back!</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field" htmlFor="username">
            <span className="login-label">Username</span>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 19c1.8-3 12.2-3 14 0" />
                </svg>
              </span>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>
          </label>
          <label className="login-field" htmlFor="password">
            <span className="login-label">Password</span>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="6" y="10" width="12" height="9" rx="2" />
                  <path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              {/* <span className="login-input-suffix" aria-hidden="true">
                <span />
                <span />
                <span />
              </span> */}
            </div>
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
