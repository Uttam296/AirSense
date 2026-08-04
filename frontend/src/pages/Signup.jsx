import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AtmospherePanel from "../components/AtmospherePanel";
import { useAuth } from "../context/AuthContext";
import { signupRequest } from "../services/api";
import styles from "../styles/Auth.module.css";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      setError("Fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const data = await signupRequest(trimmedUsername, trimmedEmail, password);
      if (data.token) {
        login(data.token, data.userId);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.error || "Couldn't create your account.");
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
            Track any city.
            <br />
            <span>Get alerted first.</span>
          </>
        }
        subline="Save favorite cities, watch AQI trends, and get predictions before the air turns bad."
      />

      <div className={styles["form-side"]}>
        <div className={styles["form-card"]}>
          <h1>Create your account</h1>
          <p className={styles.sub}>Set up monitoring in under a minute.</p>

          <div className={`${styles["error-box"]} ${error ? styles.show : ""}`}>
            {error}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Uttam"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className={styles["submit-btn"]} disabled={loading}>
              {loading ? "Please wait…" : "Create account"}
            </button>
          </form>

          <div className={styles["switch-line"]}>
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
