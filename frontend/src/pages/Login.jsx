import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AtmospherePanel from "../components/AtmospherePanel";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../services/api";
import styles from "../styles/Auth.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginRequest(trimmedEmail, password);
      login(data.token, data.userId);
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.error || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles["auth-shell"]}>
      <AtmospherePanel
        styles={styles}
        headline={
          <>
            Know your air
            <br />
            <span>before you breathe it.</span>
          </>
        }
        subline="Real-time AQI, pollutant breakdowns, and forecasts for any city, in one place."
      />

      <div className={styles["form-side"]}>
        <div className={styles["form-card"]}>
          <h1>Welcome back</h1>
          <p className={styles.sub}>Log in to see today's air quality.</p>

          <div className={`${styles["error-box"]} ${error ? styles.show : ""}`}>
            {error}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className={styles["submit-btn"]} disabled={loading}>
              {loading ? "Please wait…" : "Log in"}
            </button>
          </form>

          <div className={styles["switch-line"]}>
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
