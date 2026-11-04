import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminLogin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      // Save the secure token to the browser
      sessionStorage.setItem("adminToken", response.data.token);
      
      // Send them to the dashboard
      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-layout">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <span className="brand-mark-large">H</span>
          <h1>Hayati Admin</h1>
          <p>Sign in to manage your store.</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="login-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>

          <div className="login-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
